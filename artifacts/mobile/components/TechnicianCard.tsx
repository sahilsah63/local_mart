import { Feather } from "@expo/vector-icons";
import React from "react";
import { Image, StyleSheet, Text, TouchableOpacity, View } from "react-native";

import type { Technician } from "@workspace/api-client-react";
import { useColors } from "@/hooks/useColors";
import { RatingStars } from "./RatingStars";

interface Props {
  technician: Technician;
  onPress: () => void;
  distance?: number;
}

export function TechnicianCard({ technician, onPress, distance }: Props) {
  const colors = useColors();
  const r = colors.radius ?? 12;

  return (
    <TouchableOpacity
      style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border, borderRadius: r }]}
      onPress={onPress}
      activeOpacity={0.85}
    >
      <View style={[styles.avatar, { backgroundColor: colors.secondary, borderRadius: 40 }]}>
        {technician.profileImage ? (
          <Image source={{ uri: technician.profileImage }} style={styles.avatarImg} />
        ) : (
          <Feather name="user" size={28} color={colors.primary} />
        )}
        <View
          style={[
            styles.dot,
            { backgroundColor: technician.isAvailable ? colors.success : colors.mutedForeground },
          ]}
        />
      </View>
      <View style={styles.info}>
        <View style={styles.nameRow}>
          <Text style={[styles.name, { color: colors.foreground }]} numberOfLines={1}>
            {technician.name}
          </Text>
          {technician.isVerified && (
            <Feather name="check-circle" size={14} color={colors.primary} style={{ marginLeft: 4 }} />
          )}
        </View>
        <RatingStars rating={technician.rating} count={technician.ratingCount} />
        <View style={styles.row}>
          <Text style={[styles.rate, { color: colors.primary }]}>
            ₹{technician.hourlyRate}/hr
          </Text>
          <Text style={[styles.exp, { color: colors.mutedForeground }]}>
            {" · "}{technician.experienceYears}yr exp
          </Text>
        </View>
        <View style={styles.skills}>
          {technician.skills.slice(0, 3).map((s) => (
            <View key={s} style={[styles.skillTag, { backgroundColor: colors.secondary }]}>
              <Text style={[styles.skillText, { color: colors.secondaryForeground }]}>{s}</Text>
            </View>
          ))}
        </View>
        {distance != null && (
          <Text style={[styles.dist, { color: colors.accent }]}>
            {distance < 1 ? `${(distance * 1000).toFixed(0)}m away` : `${distance.toFixed(1)}km away`}
          </Text>
        )}
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: "row",
    borderWidth: 1,
    padding: 12,
    marginBottom: 10,
    gap: 12,
  },
  avatar: {
    width: 64,
    height: 64,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  avatarImg: { width: "100%", height: "100%", resizeMode: "cover" },
  dot: {
    position: "absolute",
    bottom: 2,
    right: 2,
    width: 12,
    height: 12,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: "#fff",
  },
  info: { flex: 1, gap: 3 },
  nameRow: { flexDirection: "row", alignItems: "center" },
  name: { fontSize: 15, fontFamily: "Inter_600SemiBold", flex: 1 },
  row: { flexDirection: "row", alignItems: "center" },
  rate: { fontSize: 13, fontFamily: "Inter_600SemiBold" },
  exp: { fontSize: 12, fontFamily: "Inter_400Regular" },
  skills: { flexDirection: "row", flexWrap: "wrap", gap: 4, marginTop: 2 },
  skillTag: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6 },
  skillText: { fontSize: 11, fontFamily: "Inter_500Medium" },
  dist: { fontSize: 12, fontFamily: "Inter_500Medium" },
});
