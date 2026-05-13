import { Feather } from "@expo/vector-icons";
import React from "react";
import { Image, StyleSheet, Text, TouchableOpacity, View } from "react-native";

import type { Shop } from "@workspace/api-client-react";
import { useColors } from "@/hooks/useColors";
import { RatingStars } from "./RatingStars";

interface Props {
  shop: Shop;
  onPress: () => void;
  distance?: number;
}

export function ShopCard({ shop, onPress, distance }: Props) {
  const colors = useColors();
  const r = colors.radius ?? 12;

  return (
    <TouchableOpacity
      style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border, borderRadius: r }]}
      onPress={onPress}
      activeOpacity={0.85}
    >
      <View style={[styles.imgWrap, { borderRadius: r - 2, backgroundColor: colors.muted }]}>
        {shop.images && shop.images.length > 0 ? (
          <Image source={{ uri: shop.images[0] }} style={styles.img} />
        ) : (
          <Feather name="shopping-bag" size={32} color={colors.mutedForeground} />
        )}
        {shop.isVerified && (
          <View style={[styles.badge, { backgroundColor: colors.primary }]}>
            <Feather name="check" size={10} color="#fff" />
          </View>
        )}
      </View>
      <View style={styles.info}>
        <Text style={[styles.name, { color: colors.foreground }]} numberOfLines={1}>
          {shop.name}
        </Text>
        <RatingStars rating={shop.rating} count={shop.ratingCount} />
        <View style={styles.row}>
          <Feather name="map-pin" size={12} color={colors.mutedForeground} />
          <Text style={[styles.addr, { color: colors.mutedForeground }]} numberOfLines={1}>
            {" "}{shop.address}
          </Text>
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
    marginBottom: 10,
    overflow: "hidden",
  },
  imgWrap: {
    width: 90,
    height: 90,
    alignItems: "center",
    justifyContent: "center",
    margin: 12,
    overflow: "hidden",
  },
  img: { width: "100%", height: "100%", resizeMode: "cover" },
  badge: {
    position: "absolute",
    top: 4,
    right: 4,
    width: 18,
    height: 18,
    borderRadius: 9,
    alignItems: "center",
    justifyContent: "center",
  },
  info: { flex: 1, paddingVertical: 12, paddingRight: 12, gap: 4, justifyContent: "center" },
  name: { fontSize: 15, fontFamily: "Inter_600SemiBold" },
  row: { flexDirection: "row", alignItems: "center" },
  addr: { fontSize: 12, fontFamily: "Inter_400Regular", flex: 1 },
  dist: { fontSize: 12, fontFamily: "Inter_500Medium" },
});
