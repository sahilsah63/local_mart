import { Feather } from "@expo/vector-icons";
import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

import type { Booking } from "@workspace/api-client-react";
import { useColors } from "@/hooks/useColors";

interface Props {
  booking: Booking;
  onPress: () => void;
}

const STATUS_COLORS: Record<string, string> = {
  pending: "#f59e0b",
  confirmed: "#3b82f6",
  in_progress: "#8b5cf6",
  completed: "#10b981",
  cancelled: "#ef4444",
};

const STATUS_ICONS: Record<string, string> = {
  pending: "clock",
  confirmed: "check-circle",
  in_progress: "tool",
  completed: "check-square",
  cancelled: "x-circle",
};

export function BookingCard({ booking, onPress }: Props) {
  const colors = useColors();
  const r = colors.radius ?? 12;
  const statusColor = STATUS_COLORS[booking.status] ?? colors.mutedForeground;
  const statusIcon = STATUS_ICONS[booking.status] ?? "circle";

  return (
    <TouchableOpacity
      style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border, borderRadius: r }]}
      onPress={onPress}
      activeOpacity={0.85}
    >
      <View style={styles.header}>
        <Text style={[styles.id, { color: colors.mutedForeground }]}>#{booking.id}</Text>
        <View style={[styles.badge, { backgroundColor: statusColor + "20" }]}>
          <Feather name={statusIcon as any} size={12} color={statusColor} />
          <Text style={[styles.badgeText, { color: statusColor }]}>
            {" "}{booking.status.replace("_", " ").toUpperCase()}
          </Text>
        </View>
      </View>
      <View style={styles.row}>
        <Feather name="calendar" size={14} color={colors.mutedForeground} />
        <Text style={[styles.date, { color: colors.foreground }]}>
          {" "}{new Date(booking.scheduledAt).toLocaleDateString("en-IN", {
            day: "numeric",
            month: "short",
            year: "numeric",
          })}
        </Text>
      </View>
      {booking.address && (
        <View style={styles.row}>
          <Feather name="map-pin" size={14} color={colors.mutedForeground} />
          <Text style={[styles.addr, { color: colors.mutedForeground }]} numberOfLines={1}>
            {" "}{booking.address}
          </Text>
        </View>
      )}
      {booking.totalAmount && (
        <Text style={[styles.amount, { color: colors.primary }]}>
          ₹{Number(booking.totalAmount).toLocaleString("en-IN")}
        </Text>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    borderWidth: 1,
    padding: 14,
    marginBottom: 10,
    gap: 6,
  },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  id: { fontSize: 12, fontFamily: "Inter_400Regular" },
  badge: { flexDirection: "row", alignItems: "center", paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
  badgeText: { fontSize: 11, fontFamily: "Inter_600SemiBold" },
  row: { flexDirection: "row", alignItems: "center" },
  date: { fontSize: 14, fontFamily: "Inter_500Medium" },
  addr: { fontSize: 13, fontFamily: "Inter_400Regular", flex: 1 },
  amount: { fontSize: 16, fontFamily: "Inter_700Bold", marginTop: 2 },
});
