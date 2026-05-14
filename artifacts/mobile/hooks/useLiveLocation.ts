import * as Location from "expo-location";
import { useEffect, useRef, useState } from "react";

import { api } from "@/lib/api";

interface Options {
  /** Push every N milliseconds (default 15000) */
  intervalMs?: number;
  /** Only push while true (e.g. only during active booking) */
  enabled?: boolean;
}

interface State {
  permissionGranted: boolean;
  lastCoords: { lat: number; lng: number } | null;
  lastPushedAt: Date | null;
  error: string | null;
}

export function useLiveLocation({ intervalMs = 15000, enabled = true }: Options = {}) {
  const [state, setState] = useState<State>({
    permissionGranted: false,
    lastCoords: null,
    lastPushedAt: null,
    error: null,
  });

  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Ask permission once
  useEffect(() => {
    (async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        setState((s) => ({ ...s, permissionGranted: status === "granted" }));
      } catch (e: any) {
        setState((s) => ({ ...s, error: e?.message ?? "Permission error" }));
      }
    })();
  }, []);

  // Push loop
  useEffect(() => {
    if (!enabled || !state.permissionGranted) {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      return;
    }

    const pushOnce = async () => {
      try {
        const loc = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced,
        });
        const coords = { lat: loc.coords.latitude, lng: loc.coords.longitude };

        await api.post("/location/update", coords);

        setState((s) => ({ ...s, lastCoords: coords, lastPushedAt: new Date(), error: null }));
      } catch (e: any) {
        setState((s) => ({ ...s, error: e?.message ?? "Push failed" }));
      }
    };

    // Push immediately, then on interval
    pushOnce();
    intervalRef.current = setInterval(pushOnce, intervalMs);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      intervalRef.current = null;
    };
  }, [enabled, state.permissionGranted, intervalMs]);

  return state;
}