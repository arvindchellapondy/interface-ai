"use client";

import React, { useState, useEffect, useCallback } from "react";

interface Device {
  id: string;
  platform: string;
  connectedAt: string;
}

interface ConnectedDevicesProps {
  designId: string;
  messages: unknown[];
}

export default function ConnectedDevices({ designId, messages }: ConnectedDevicesProps) {
  const [devices, setDevices] = useState<Device[]>([]);
  const [pushing, setPushing] = useState<string | null>(null);
  const [status, setStatus] = useState<string | null>(null);

  const fetchDevices = useCallback(async () => {
    try {
      const res = await fetch("/api/devices");
      const data = await res.json();
      setDevices(data);
    } catch {
      // ignore fetch errors
    }
  }, []);

  useEffect(() => {
    fetchDevices();
    const interval = setInterval(fetchDevices, 3000);
    return () => clearInterval(interval);
  }, [fetchDevices]);

  const pushToDevice = async (deviceId: string) => {
    setPushing(deviceId);
    setStatus(null);
    try {
      const res = await fetch("/api/devices/push", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ deviceId, messages }),
      });
      if (res.ok) {
        setStatus(`Pushed to ${deviceId}`);
      } else {
        const err = await res.json();
        setStatus(`Error: ${err.error}`);
      }
    } catch {
      setStatus("Push failed");
    }
    setPushing(null);
  };

  const pushToAll = async () => {
    setPushing("all");
    setStatus(null);
    try {
      const res = await fetch("/api/devices/push", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages }),
      });
      const data = await res.json();
      setStatus(`Pushed to ${data.pushed} device(s)`);
    } catch {
      setStatus("Push failed");
    }
    setPushing(null);
  };

  const platformIcon = (platform: string) => {
    if (platform === "ios") return "iPhone";
    if (platform === "android") return "Android";
    return platform;
  };

  return (
    <div style={{ padding: 12, background: "#fafafa", borderRadius: 8, border: "1px solid #e0e0e0" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
        <div style={{ fontSize: 12, fontWeight: 600, color: "#666" }}>
          CONNECTED DEVICES ({devices.length})
        </div>
        {devices.length > 0 && (
          <button
            onClick={pushToAll}
            disabled={pushing !== null}
            style={{
              fontSize: 11,
              padding: "4px 10px",
              borderRadius: 4,
              border: "1px solid #4CAF50",
              background: "#4CAF50",
              color: "#fff",
              cursor: pushing ? "not-allowed" : "pointer",
              opacity: pushing ? 0.6 : 1,
            }}
          >
            {pushing === "all" ? "Pushing..." : "Push to All"}
          </button>
        )}
      </div>

      {devices.length === 0 ? (
        <div style={{ fontSize: 12, color: "#999", padding: "8px 0" }}>
          No devices connected. Run the iOS or Android demo app and connect to{" "}
          <code style={{ fontSize: 11, background: "#eee", padding: "1px 4px", borderRadius: 2 }}>
            ws://localhost:3001/ws
          </code>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          {devices.map((device) => (
            <div
              key={device.id}
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                padding: "6px 8px",
                background: "#fff",
                borderRadius: 4,
                border: "1px solid #e0e0e0",
                fontSize: 12,
              }}
            >
              <div>
                <span style={{ fontWeight: 600 }}>{device.id}</span>
                <span style={{ color: "#888", marginLeft: 8 }}>{platformIcon(device.platform)}</span>
              </div>
              <button
                onClick={() => pushToDevice(device.id)}
                disabled={pushing !== null}
                style={{
                  fontSize: 11,
                  padding: "3px 8px",
                  borderRadius: 4,
                  border: "1px solid #2196F3",
                  background: "#2196F3",
                  color: "#fff",
                  cursor: pushing ? "not-allowed" : "pointer",
                  opacity: pushing ? 0.6 : 1,
                }}
              >
                {pushing === device.id ? "Pushing..." : "Push"}
              </button>
            </div>
          ))}
        </div>
      )}

      {status && (
        <div
          style={{
            marginTop: 8,
            fontSize: 11,
            color: status.startsWith("Error") ? "#f44336" : "#4CAF50",
          }}
        >
          {status}
        </div>
      )}
    </div>
  );
}
