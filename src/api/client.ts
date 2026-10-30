import { CONFIG } from "../config.js";
import { authService } from "./auth.js";
import { Card, Device, DisplayIcon, LibraryResponse } from "../models/index.js";
import { dispatchToast } from "../widgets/events.js";

// ==============================================================================
// Yoto REST API Client with Silent Token Refresh
// See: docs/rfcs/006-error-handling-and-toast-notifications.md
//      pkg/yoto/http_client.go in yotocli
// ==============================================================================

export class YotoApiClient {
  private baseUrl: string;

  constructor(baseUrl = CONFIG.apiBaseUrl) {
    this.baseUrl = baseUrl;
  }

  /**
   * Internal fetch wrapper with authorization header injection and silent 401 refresh.
   */
  private async request<T>(
    path: string,
    options: RequestInit = {},
  ): Promise<T> {
    let session = authService.getSession();
    if (!session) {
      throw new Error("User is not authenticated.");
    }

    // Proactively refresh expired token before making request if refresh token exists
    if (session.refreshToken && Date.now() >= session.expiresAt - 60000) {
      const refreshedToken = await authService.refreshToken();
      if (refreshedToken) {
        session = authService.getSession()!;
      }
    }

    const headers = new Headers(options.headers || {});
    headers.set("Authorization", `Bearer ${session.accessToken}`);
    if (
      !headers.has("Content-Type") &&
      !(options.body instanceof FormData) &&
      !(options.body instanceof Blob)
    ) {
      headers.set("Content-Type", "application/json");
    }

    let url = path.startsWith("http") ? path : `${this.baseUrl}${path}`;
    let response = await fetch(url, { ...options, headers });

    // Silent token refresh on 401 per RFC 006
    if (response.status === 401) {
      const newAccessToken = await authService.refreshToken();
      if (newAccessToken) {
        headers.set("Authorization", `Bearer ${newAccessToken}`);
        response = await fetch(url, { ...options, headers });
      } else {
        dispatchToast(window, {
          type: "warning",
          message: "Your session has expired. Please sign in again.",
        });
        throw new Error("Session expired.");
      }
    }

    if (!response.ok) {
      const errorText = await response.text();
      const err = new Error(
        `API Request failed (${response.status}): ${errorText}`,
      );
      dispatchToast(window, {
        type: "error",
        message: `API Error: ${response.status} ${response.statusText}`,
        errorDetail: errorText,
      });
      throw err;
    }

    if (response.status === 204) {
      return {} as T;
    }

    const text = await response.text();
    if (!text || !text.trim()) {
      return {} as T;
    }

    try {
      return JSON.parse(text) as T;
    } catch {
      return text as unknown as T;
    }
  }

  // --- Library / Cards ---

  public async listCards(): Promise<Card[]> {
    const data = await this.request<LibraryResponse>("/card/family/library");
    return (data.cards || []).map((c) => c.card);
  }

  public async getCard(id: string): Promise<Card> {
    const data = await this.request<{ card: Card }>(
      `/card/${encodeURIComponent(id)}`,
    );
    return data.card;
  }

  public async deleteCard(id: string): Promise<void> {
    await this.request<void>(`/content/${encodeURIComponent(id)}`, {
      method: "DELETE",
    });
  }

  public async createCard(
    card: Partial<Card>,
  ): Promise<{ cardId?: string; card?: Card }> {
    return await this.request<{ cardId?: string; card?: Card }>("/content", {
      method: "POST",
      body: JSON.stringify(card),
    });
  }

  public async updateCard(card: Card): Promise<void> {
    await this.request<void>("/content", {
      method: "POST",
      body: JSON.stringify(card),
    });
  }

  // --- Devices ---

  public async listDevices(): Promise<Device[]> {
    const data = await this.request<{ devices: Device[] }>(
      "/device-v2/devices/mine",
    );
    return data.devices || [];
  }

  // --- Icons ---

  public async getPublicIcons(): Promise<DisplayIcon[]> {
    const data = await this.request<{ displayIcons: DisplayIcon[] }>(
      "/media/displayIcons/user/yoto",
    );
    return data.displayIcons || [];
  }

  public async getUserIcons(): Promise<DisplayIcon[]> {
    const data = await this.request<{ displayIcons: DisplayIcon[] }>(
      "/media/displayIcons/user/me",
    );
    return data.displayIcons || [];
  }

  public async uploadIcon(fileBlob: Blob): Promise<string> {
    interface UploadResponse {
      displayIcon?: {
        mediaId?: string;
        displayIconId?: string;
      };
      id?: string;
    }

    const res = await this.request<UploadResponse>(
      "/media/displayIcons/user/me/upload?autoConvert=true&filename=icon.png",
      {
        method: "POST",
        headers: {
          "Content-Type": "image/png",
        },
        body: fileBlob,
      },
    );

    const iconId =
      res.displayIcon?.mediaId || res.displayIcon?.displayIconId || res.id;
    if (!iconId) {
      throw new Error(
        "Upload succeeded but no icon ID was returned in response.",
      );
    }
    return iconId;
  }

  // --- Audio Uploads & Transcoding (RFC 008) ---

  /**
   * Requests a presigned S3 upload URL for an audio file.
   * If Yoto already holds audio with the matching sha256, uploadUrl will be empty
   * and uploadId points to the already existing asset (deduplication).
   */
  public async getUploadUrl(
    sha256?: string,
    filename?: string,
  ): Promise<UploadURLResponse> {
    const params = new URLSearchParams();
    if (sha256) params.set("sha256", sha256);
    if (filename) params.set("filename", filename);
    const query = params.toString() ? `?${params.toString()}` : "";
    return await this.request<UploadURLResponse>(
      `/media/transcode/audio/uploadUrl${query}`,
    );
  }

  /**
   * Uploads an audio binary directly to a presigned S3 PUT URL.
   * Note: S3 presigned URLs must NOT include Yoto authorization headers.
   */
  public async uploadFileToS3(
    uploadUrl: string,
    fileBlob: Blob,
    contentType = "audio/mp3",
    onProgress?: (percent: number) => void,
  ): Promise<void> {
    return new Promise<void>((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      xhr.open("PUT", uploadUrl, true);
      xhr.setRequestHeader("Content-Type", contentType);

      if (onProgress && xhr.upload) {
        xhr.upload.onprogress = (event) => {
          if (event.lengthComputable) {
            const percent = Math.round((event.loaded / event.total) * 100);
            onProgress(percent);
          }
        };
      }

      xhr.onload = () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          resolve();
        } else {
          reject(
            new Error(
              `S3 upload failed with status ${xhr.status}: ${xhr.statusText}`,
            ),
          );
        }
      };

      xhr.onerror = () => {
        reject(new Error("Network error during S3 direct upload."));
      };

      xhr.send(fileBlob);
    });
  }

  /**
   * Polls Yoto's transcode worker until normalization and transcoding to Opus finishes.
   */
  public async pollTranscode(
    uploadId: string,
    maxWaitMs = 15 * 60 * 1000,
    pollIntervalMs = 750,
  ): Promise<TranscodeData> {
    const deadline = Date.now() + maxWaitMs;

    while (Date.now() < deadline) {
      const result = await this.request<Record<string, unknown>>(
        `/media/upload/${encodeURIComponent(uploadId)}/transcoded`,
      );

      const data = (result.transcode && typeof result.transcode === "object"
        ? result.transcode
        : result) as unknown as TranscodeData;

      if (data && (data.complete || !!data.transcodedSha256)) {
        return data;
      }

      await new Promise((r) => setTimeout(r, pollIntervalMs));
    }

    throw new Error(`Audio transcode timed out for upload ${uploadId}`);
  }
}

export interface UploadURLResponse {
  upload: {
    uploadUrl?: string;
    uploadId: string;
  };
}

export interface TranscodeInfo {
  duration?: number;
  fileSize?: number;
  format?: string;
  channels?: string;
}

export interface TranscodeData {
  transcodedSha256?: string;
  complete?: boolean;
  transcodedInfo?: TranscodeInfo;
}

export const yotoApi = new YotoApiClient();
