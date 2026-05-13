import { Feather } from "@expo/vector-icons";
import React from "react";
import { Image, StyleSheet, Text, TouchableOpacity, View } from "react-native";

import type { Product } from "@workspace/api-client-react";
import { useColors } from "@/hooks/useColors";

interface Props {
  product: Product;
  onPress?: () => void;
}

export function ProductCard({ product, onPress }: Props) {
  const colors = useColors();
  const r = colors.radius ?? 12;

  return (
    <TouchableOpacity
      style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border, borderRadius: r }]}
      onPress={onPress}
      activeOpacity={0.85}
    >
      <View style={[styles.imgWrap, { backgroundColor: colors.muted, borderRadius: r - 2 }]}>
        {product.images && product.images.length > 0 ? (
          <Image source={{ uri: product.images[0] }} style={styles.img} />
        ) : (
          <Feather name="box" size={24} color={colors.mutedForeground} />
        )}
      </View>
      <Text style={[styles.name, { color: colors.foreground }]} numberOfLines={2}>
        {product.name}
      </Text>
      <Text style={[styles.price, { color: colors.primary }]}>
        ₹{Number(product.price).toLocaleString("en-IN")}
      </Text>
      {product.stockQuantity <= 5 && (
        <Text style={[styles.stock, { color: colors.warning }]}>
          Only {product.stockQuantity} left
        </Text>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    width: 160,
    borderWidth: 1,
    padding: 10,
    marginRight: 10,
    gap: 6,
  },
  imgWrap: {
    width: "100%",
    height: 110,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
    marginBottom: 4,
  },
  img: { width: "100%", height: "100%", resizeMode: "contain" },
  name: { fontSize: 13, fontFamily: "Inter_500Medium", lineHeight: 18 },
  price: { fontSize: 15, fontFamily: "Inter_700Bold" },
  stock: { fontSize: 11, fontFamily: "Inter_400Regular" },
});
