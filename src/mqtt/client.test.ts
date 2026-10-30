import { expect } from "@open-wc/testing";
import { YotoMqttClient } from "./client.js";
import { DeviceStatus } from "../models/index.js";

describe("YotoMqttClient", () => {
  let client: YotoMqttClient;

  beforeEach(() => {
    client = new YotoMqttClient("wss://example.com/mqtt");
  });

  afterEach(() => {
    client.disconnectAll();
  });

  describe("normalizeStatus", () => {
    it("normalizes a standard status object", () => {
      const raw = {
        status: {
          statusVersion: 2,
          fwVersion: "v2.17.2",
          productType: "v3",
          batteryLevel: 85,
          charging: true,
          freeDisk: 500000,
          als: 10,
          activeCard: "card-abc-123",
          cardInserted: true,
          playingStatus: "playing",
          headphones: false,
          bluetoothHp: false,
          volume: 10,
          userVolume: 10,
          timeFormat: "24h",
          nightlightMode: "off",
          day: true,
        },
      };

      const result: DeviceStatus = client.normalizeStatus(raw);
      expect(result.fwVersion).to.equal("v2.17.2");
      expect(result.productType).to.equal("v3");
      expect(result.batteryLevel).to.equal(85);
      expect(result.charging).to.be.true;
      expect(result.activeCard).to.equal("card-abc-123");
      expect(result.cardInserted).to.be.true;
      expect(result.playingStatus).to.equal("playing");
      expect(result.volume).to.equal(10);
      expect(result.day).to.be.true;
    });

    it("handles booleans encoded as integers and strings from physical hardware", () => {
      const raw = {
        batteryLevel: "92",
        charging: 1,
        cardInserted: "true",
        headphones: 0,
        bluetoothHp: "1",
        day: "false",
        volume: "12",
      };

      const result = client.normalizeStatus(raw);
      expect(result.batteryLevel).to.equal(92);
      expect(result.charging).to.be.true;
      expect(result.cardInserted).to.be.true;
      expect(result.headphones).to.be.false;
      expect(result.bluetoothHp).to.be.true;
      expect(result.day).to.be.false;
      expect(result.volume).to.equal(12);
      expect(result.playingStatus).to.equal("idle");
    });

    it("provides safe defaults when fields are missing or undefined", () => {
      const raw = {};
      const result = client.normalizeStatus(raw);
      expect(result.batteryLevel).to.equal(0);
      expect(result.charging).to.be.false;
      expect(result.cardInserted).to.be.false;
      expect(result.volume).to.equal(0);
      expect(result.activeCard).to.equal("");
      expect(result.playingStatus).to.equal("idle");
    });
  });

  describe("callbacks and listener management", () => {
    it("registers and triggers status callbacks", () => {
      const updates: DeviceStatus[] = [];
      const unsub = client.onStatus("dev1", (status) => {
        updates.push(status);
      });

      expect(updates.length).to.equal(0);

      // Simulate connection and message reception internally
      const mockStatus: DeviceStatus = {
        batteryLevel: 75,
        charging: false,
        volume: 6,
      };

      // When lastStatus is set, new subscriber immediately receives it
      const conn = (
        client as unknown as { connections: Map<string, unknown> }
      ).connections.get("dev1") as {
        statusCallbacks: Set<(status: DeviceStatus) => void>;
        lastStatus: DeviceStatus | null;
      };
      conn.lastStatus = mockStatus;
      conn.statusCallbacks.forEach((cb) => cb(mockStatus));

      expect(updates.length).to.equal(1);
      expect(updates[0]?.batteryLevel).to.equal(75);

      unsub();
      expect(conn.statusCallbacks.size).to.equal(0);
    });

    it("manages connection status callbacks", () => {
      const states: boolean[] = [];
      const unsub = client.onConnectionChange("dev1", (connected) => {
        states.push(connected);
      });

      // Initially receives current state (false)
      expect(states).to.deep.equal([false]);

      unsub();
    });
  });

  describe("command publishing", () => {
    it("publishes playCard command with correct topic and payload", () => {
      let publishedTopic = "";
      let publishedPayload = "";

      const mockMqttClient = {
        publish: (topic: string, payload: string) => {
          publishedTopic = topic;
          publishedPayload = payload;
        },
        end: () => {},
        disconnected: false,
      };

      (
        client as unknown as { connections: Map<string, unknown> }
      ).connections.set("dev123", {
        client: mockMqttClient,
        statusCallbacks: new Set(),
        connectionCallbacks: new Set(),
        lastStatus: null,
        isConnected: true,
      });

      client.playCard("dev123", "card-999");
      expect(publishedTopic).to.equal("device/dev123/command/card/start");
      expect(JSON.parse(publishedPayload)).to.deep.equal({ uri: "card-999" });
    });

    it("publishes setVolume command with rounded volume", () => {
      let publishedTopic = "";
      let publishedPayload = "";

      const mockMqttClient = {
        publish: (topic: string, payload: string) => {
          publishedTopic = topic;
          publishedPayload = payload;
        },
        end: () => {},
        disconnected: false,
      };

      (
        client as unknown as { connections: Map<string, unknown> }
      ).connections.set("dev123", {
        client: mockMqttClient,
        statusCallbacks: new Set(),
        connectionCallbacks: new Set(),
        lastStatus: null,
        isConnected: true,
      });

      client.setVolume("dev123", 8.4);
      expect(publishedTopic).to.equal("device/dev123/command/volume/set");
      expect(JSON.parse(publishedPayload)).to.deep.equal({ volume: 8 });
    });

    it("publishes pausePlayer and stopPlayer commands", () => {
      const topics: string[] = [];

      const mockMqttClient = {
        publish: (topic: string) => {
          topics.push(topic);
        },
        end: () => {},
        disconnected: false,
      };

      (
        client as unknown as { connections: Map<string, unknown> }
      ).connections.set("dev123", {
        client: mockMqttClient,
        statusCallbacks: new Set(),
        connectionCallbacks: new Set(),
        lastStatus: null,
        isConnected: true,
      });

      client.pausePlayer("dev123");
      client.stopPlayer("dev123");

      expect(topics).to.deep.equal([
        "device/dev123/command/card/pause",
        "device/dev123/command/card/stop",
      ]);
    });
  });
});
