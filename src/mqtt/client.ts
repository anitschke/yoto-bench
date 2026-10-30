import mqtt, { type MqttClient } from "mqtt";
import { CONFIG } from "../config.js";
import { DeviceStatus } from "../models/index.js";

function getMqttConnect(): typeof mqtt.connect {
  if (typeof mqtt?.connect === "function") {
    return mqtt.connect;
  }
  const defaultObj = (
    mqtt as unknown as { default?: { connect?: typeof mqtt.connect } }
  )?.default;
  if (typeof defaultObj?.connect === "function") {
    return defaultObj.connect;
  }
  throw new Error("MQTT connect function is not available.");
}

// ==============================================================================
// Yoto MQTT over WebSocket Client for AWS IoT Core
// See: docs/rfcs/018-device-management-and-remote-control.md
//      pkg/yoto/mqtt_client.go in yotocli
// ==============================================================================

export type StatusCallback = (status: DeviceStatus) => void;
export type ConnectionCallback = (connected: boolean) => void;

export interface DeviceConnection {
  client: MqttClient;
  statusCallbacks: Set<StatusCallback>;
  connectionCallbacks: Set<ConnectionCallback>;
  lastStatus: DeviceStatus | null;
  isConnected: boolean;
}

export class YotoMqttClient {
  private brokerUrl: string;
  private connections = new Map<string, DeviceConnection>();

  constructor(brokerUrl = CONFIG.mqttBrokerUrl) {
    this.brokerUrl = brokerUrl;
  }

  /**
   * Parse and normalize raw status payload from device.
   * Handles variations where booleans are encoded as numbers or strings.
   */
  public normalizeStatus(raw: Record<string, unknown>): DeviceStatus {
    const toBool = (val: unknown): boolean => {
      if (typeof val === "boolean") return val;
      if (typeof val === "number") return val !== 0;
      if (typeof val === "string") {
        const lower = val.toLowerCase();
        return lower === "true" || lower === "1";
      }
      return false;
    };

    const toNum = (val: unknown, fallback = 0): number => {
      if (typeof val === "number" && !isNaN(val)) return val;
      if (typeof val === "string") {
        const parsed = Number(val);
        return isNaN(parsed) ? fallback : parsed;
      }
      return fallback;
    };

    const toStr = (val: unknown, fallback = ""): string => {
      if (typeof val === "string") return val;
      if (val !== undefined && val !== null) return String(val);
      return fallback;
    };

    const s =
      raw.status && typeof raw.status === "object"
        ? (raw.status as Record<string, unknown>)
        : raw;

    return {
      statusVersion: toNum(s.statusVersion),
      fwVersion: toStr(s.fwVersion),
      productType: toStr(s.productType),
      batteryLevel: toNum(s.batteryLevel),
      charging: toBool(s.charging),
      freeDisk: toNum(s.freeDisk),
      als: toNum(s.als),
      activeCard: toStr(s.activeCard),
      cardInserted: toBool(s.cardInserted),
      playingStatus: toStr(s.playingStatus, "idle"),
      headphones: toBool(s.headphones),
      bluetoothHp: toBool(s.bluetoothHp),
      volume: toNum(s.volume),
      userVolume: toNum(s.userVolume),
      timeFormat: toStr(s.timeFormat),
      nightlightMode: toStr(s.nightlightMode),
      day: toBool(s.day),
    };
  }

  /**
   * Get or create an MQTT connection for a given device.
   */
  public connect(deviceId: string, token: string): DeviceConnection {
    let conn = this.connections.get(deviceId);
    if (conn && conn.client && !conn.client.disconnected) {
      return conn;
    }

    if (conn && conn.client) {
      conn.client.end(true);
    }

    const clientId = `DASH${deviceId}`;
    const username = `${deviceId}?x-amz-customauthorizer-name=PublicJWTAuthorizer`;

    const statusTopic = `device/${deviceId}/data/status`;
    const responseTopic = `device/${deviceId}/response`;
    const eventsTopic = `device/${deviceId}/data/events`;

    const statusCallbacks = conn
      ? conn.statusCallbacks
      : new Set<StatusCallback>();
    const connectionCallbacks = conn
      ? conn.connectionCallbacks
      : new Set<ConnectionCallback>();

    const connect = getMqttConnect();
    const client = connect(this.brokerUrl, {
      clientId,
      username,
      password: token,
      clean: true,
      keepalive: 300,
      reconnectPeriod: 5000,
      protocol: "wss",
    });

    conn = {
      client,
      statusCallbacks,
      connectionCallbacks,
      lastStatus: conn ? conn.lastStatus : null,
      isConnected: false,
    };
    this.connections.set(deviceId, conn);

    client.on("connect", () => {
      if (!conn) return;
      conn.isConnected = true;
      conn.connectionCallbacks.forEach((cb) => cb(true));

      // Subscribe to device topics
      client.subscribe([statusTopic, responseTopic, eventsTopic], (err) => {
        if (!err) {
          // Immediately request fresh status upon connection
          this.requestStatus(deviceId);
        }
      });
    });

    client.on("close", () => {
      if (!conn) return;
      conn.isConnected = false;
      conn.connectionCallbacks.forEach((cb) => cb(false));
    });

    client.on("error", () => {
      if (!conn) return;
      conn.isConnected = false;
      conn.connectionCallbacks.forEach((cb) => cb(false));
    });

    client.on(
      "message",
      (topic: string, message: { toString: () => string }) => {
        const cleanTopic = topic.startsWith("/") ? topic.slice(1) : topic;
        if (cleanTopic === statusTopic || cleanTopic === eventsTopic) {
          try {
            const parsed = JSON.parse(message.toString()) as Record<
              string,
              unknown
            >;
            const normalized = this.normalizeStatus(parsed);
            if (conn) {
              conn.lastStatus = normalized;
              conn.statusCallbacks.forEach((cb) => cb(normalized));
            }
          } catch {
            // Ignore malformed message
          }
        }
      },
    );

    return conn;
  }

  public onStatus(deviceId: string, callback: StatusCallback): () => void {
    let conn = this.connections.get(deviceId);
    if (!conn) {
      conn = {
        client: null as unknown as mqtt.MqttClient,
        statusCallbacks: new Set<StatusCallback>(),
        connectionCallbacks: new Set<ConnectionCallback>(),
        lastStatus: null,
        isConnected: false,
      };
      this.connections.set(deviceId, conn);
    }
    conn.statusCallbacks.add(callback);
    if (conn.lastStatus) {
      callback(conn.lastStatus);
    }
    return () => {
      conn?.statusCallbacks.delete(callback);
    };
  }

  public onConnectionChange(
    deviceId: string,
    callback: ConnectionCallback,
  ): () => void {
    let conn = this.connections.get(deviceId);
    if (!conn) {
      conn = {
        client: null as unknown as MqttClient,
        statusCallbacks: new Set<StatusCallback>(),
        connectionCallbacks: new Set<ConnectionCallback>(),
        lastStatus: null,
        isConnected: false,
      };
      this.connections.set(deviceId, conn);
    }
    conn.connectionCallbacks.add(callback);
    callback(conn.isConnected);
    return () => {
      conn?.connectionCallbacks.delete(callback);
    };
  }

  public getLastStatus(deviceId: string): DeviceStatus | null {
    return this.connections.get(deviceId)?.lastStatus || null;
  }

  public isConnected(deviceId: string): boolean {
    return this.connections.get(deviceId)?.isConnected || false;
  }

  public requestStatus(deviceId: string): void {
    const conn = this.connections.get(deviceId);
    if (conn && conn.client && conn.isConnected) {
      conn.client.publish(`device/${deviceId}/command/status/request`, "");
    }
  }

  public setVolume(deviceId: string, volume: number): void {
    const conn = this.connections.get(deviceId);
    if (conn && conn.client && conn.isConnected) {
      const payload = JSON.stringify({ volume: Math.round(volume) });
      conn.client.publish(`device/${deviceId}/command/volume/set`, payload);
    }
  }

  public playCard(deviceId: string, cardId: string): void {
    const conn = this.connections.get(deviceId);
    if (conn && conn.client && conn.isConnected) {
      const payload = JSON.stringify({ uri: cardId });
      conn.client.publish(`device/${deviceId}/command/card/start`, payload);
    }
  }

  public stopPlayer(deviceId: string): void {
    const conn = this.connections.get(deviceId);
    if (conn && conn.client && conn.isConnected) {
      conn.client.publish(`device/${deviceId}/command/card/stop`, "");
    }
  }

  public pausePlayer(deviceId: string): void {
    const conn = this.connections.get(deviceId);
    if (conn && conn.client && conn.isConnected) {
      conn.client.publish(`device/${deviceId}/command/card/pause`, "");
    }
  }

  public disconnect(deviceId: string): void {
    const conn = this.connections.get(deviceId);
    if (conn && conn.client) {
      conn.client.end(true);
      conn.isConnected = false;
      this.connections.delete(deviceId);
    }
  }

  public disconnectAll(): void {
    for (const [, conn] of this.connections.entries()) {
      if (conn.client) {
        conn.client.end(true);
      }
      conn.isConnected = false;
    }
    this.connections.clear();
  }
}

export const yotoMqtt = new YotoMqttClient();
