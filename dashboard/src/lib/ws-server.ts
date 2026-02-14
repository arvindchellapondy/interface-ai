import { WebSocketServer, WebSocket } from "ws";
import type { IncomingMessage } from "http";
import type { Server } from "http";

export interface ConnectedDevice {
  id: string;
  platform: string;
  connectedAt: string;
  ws: WebSocket;
}

const devices = new Map<string, ConnectedDevice>();

let wss: WebSocketServer | null = null;

export function getConnectedDevices(): Omit<ConnectedDevice, "ws">[] {
  return Array.from(devices.values()).map(({ ws, ...rest }) => rest);
}

export function pushToDevice(deviceId: string, messages: unknown[]): boolean {
  const device = devices.get(deviceId);
  if (!device || device.ws.readyState !== WebSocket.OPEN) return false;

  device.ws.send(
    JSON.stringify({ type: "a2ui_messages", messages })
  );
  return true;
}

export function pushToAllDevices(messages: unknown[]): number {
  let count = 0;
  const payload = JSON.stringify({ type: "a2ui_messages", messages });
  for (const device of devices.values()) {
    if (device.ws.readyState === WebSocket.OPEN) {
      device.ws.send(payload);
      count++;
    }
  }
  return count;
}

export function initWebSocketServer(server: Server): WebSocketServer {
  if (wss) return wss;

  wss = new WebSocketServer({ server, path: "/ws" });

  wss.on("connection", (ws: WebSocket, req: IncomingMessage) => {
    let deviceId = `device-${Date.now()}`;

    console.log(`[WS] New connection from ${req.socket.remoteAddress}`);

    ws.on("message", (data: Buffer) => {
      try {
        const msg = JSON.parse(data.toString());

        if (msg.type === "register") {
          deviceId = msg.deviceId || deviceId;
          const device: ConnectedDevice = {
            id: deviceId,
            platform: msg.platform || "unknown",
            connectedAt: new Date().toISOString(),
            ws,
          };
          devices.set(deviceId, device);
          console.log(`[WS] Device registered: ${deviceId} (${device.platform})`);

          ws.send(JSON.stringify({ type: "registered", deviceId }));
        }
      } catch {
        // ignore non-JSON messages
      }
    });

    ws.on("close", () => {
      devices.delete(deviceId);
      console.log(`[WS] Device disconnected: ${deviceId}`);
    });

    ws.on("error", (err) => {
      console.error(`[WS] Error for ${deviceId}:`, err.message);
      devices.delete(deviceId);
    });
  });

  console.log("[WS] WebSocket server initialized on /ws");
  return wss;
}
