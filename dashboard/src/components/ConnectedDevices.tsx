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
    <div className="panel">
      <div className="flex justify-between items-center mb-4">
        <div className="section-label mb-0">Connected Devices ({devices.length})</div>
        {devices.length > 0 && (
          <button
            onClick={pushToAll}
            disabled={pushing !== null}
            className="btn-sm btn-success"
          >
            {pushing === "all" ? "Pushing..." : "Push to All"}
          </button>
        )}
      </div>

      {devices.length === 0 ? (
        <div className="text-sm text-slate-400 py-3">
          No devices connected. Run the iOS or Android demo app and connect to{" "}
          <code className="text-xs bg-slate-100 px-1.5 py-0.5 rounded font-mono">
            ws://localhost:3001/ws
          </code>
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {devices.map((device) => (
            <div
              key={device.id}
              className="flex justify-between items-center px-4 py-2.5 bg-slate-50
                         rounded-lg border border-slate-100 text-sm hover:bg-slate-100
                         transition-colors duration-100"
            >
              <div>
                <span className="font-semibold text-slate-700">{device.id}</span>
                <span className="text-slate-400 ml-2">{platformIcon(device.platform)}</span>
              </div>
              <button
                onClick={() => pushToDevice(device.id)}
                disabled={pushing !== null}
                className="btn-sm btn-sky"
              >
                {pushing === device.id ? "Pushing..." : "Push"}
              </button>
            </div>
          ))}
        </div>
      )}

      {status && (
        <div className={`mt-2.5 text-xs font-medium ${
          status.startsWith("Error") ? "text-rose-500" : "text-emerald-600"
        }`}>
          {status}
        </div>
      )}
    </div>
  );
}
