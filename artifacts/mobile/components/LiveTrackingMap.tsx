import React from "react";
import { Platform, StyleSheet, View, Text } from "react-native";

interface Point {
  lat: number;
  lng: number;
  label: string;
  color?: string;
}

interface Props {
  points: Point[];
  height?: number;
}

export function LiveTrackingMap({ points, height = 300 }: Props) {
  if (points.length === 0) {
    return (
      <View style={[styles.empty, { height }]}>
        <Text style={{ color: "#666" }}>Waiting for location updates…</Text>
      </View>
    );
  }

  // Compute center as average of all points
  const center = {
    lat: points.reduce((s, p) => s + p.lat, 0) / points.length,
    lng: points.reduce((s, p) => s + p.lng, 0) / points.length,
  };

  if (Platform.OS === "web") {
    return <WebLeafletMap points={points} center={center} height={height} />;
  }
  return <NativeMap points={points} center={center} height={height} />;
}

/* ----------------------------- NATIVE ----------------------------- */
function NativeMap({ points, center, height }: { points: Point[]; center: { lat: number; lng: number }; height: number }) {
  // Dynamic import so web build doesn't break
  const Maps = require("react-native-maps");
  const MapView = Maps.default;
  const { Marker, UrlTile, Polyline, PROVIDER_DEFAULT } = Maps;

  return (
    <View style={{ height, borderRadius: 12, overflow: "hidden" }}>
      <MapView
        provider={PROVIDER_DEFAULT}
        style={{ flex: 1 }}
        initialRegion={{
          latitude: center.lat,
          longitude: center.lng,
          latitudeDelta: 0.05,
          longitudeDelta: 0.05,
        }}
      >
        <UrlTile
          urlTemplate="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
          maximumZ={19}
          flipY={false}
        />
        {points.map((p, i) => (
          <Marker
            key={i}
            coordinate={{ latitude: p.lat, longitude: p.lng }}
            title={p.label}
            pinColor={p.color ?? "red"}
          />
        ))}
        {points.length === 2 && (
          <Polyline
            coordinates={points.map((p) => ({ latitude: p.lat, longitude: p.lng }))}
            strokeColor="#1a56db"
            strokeWidth={3}
          />
        )}
      </MapView>
    </View>
  );
}

/* ------------------------------ WEB ------------------------------- */
function WebLeafletMap({ points, center, height }: { points: Point[]; center: { lat: number; lng: number }; height: number }) {
  const markersJson = JSON.stringify(points);
  const html = `<!DOCTYPE html>
<html><head>
<link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"/>
<style>html,body,#map{margin:0;height:100%;width:100%}</style>
</head><body>
<div id="map"></div>
<script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
<script>
  const map = L.map('map').setView([${center.lat}, ${center.lng}], 13);
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '© OpenStreetMap', maxZoom: 19
  }).addTo(map);
  const pts = ${markersJson};
  const latlngs = [];
  pts.forEach(p => {
    const m = L.marker([p.lat, p.lng]).addTo(map).bindPopup(p.label);
    latlngs.push([p.lat, p.lng]);
  });
  if (latlngs.length === 2) {
    L.polyline(latlngs, { color: '#1a56db', weight: 3 }).addTo(map);
    map.fitBounds(latlngs, { padding: [40, 40] });
  } else if (latlngs.length === 1) {
    map.setView(latlngs[0], 15);
  }
</script>
</body></html>`;

  const srcDoc = html;

  return (
    <View style={{ height, borderRadius: 12, overflow: "hidden" }}>
      {/* @ts-ignore - iframe is a valid web element */}
      <iframe
        srcDoc={srcDoc}
        style={{ border: 0, width: "100%", height: "100%" }}
        title="Live tracking map"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  empty: {
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f1f5f9",
    borderRadius: 12,
  },
});