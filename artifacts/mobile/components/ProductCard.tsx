import React from "react";
import { Image, StyleSheet, Text, TouchableOpacity, View } from "react-native";

import { cldUrl } from "@/lib/cloudinary";
import { useColors } from "@/hooks/useColors";

interface Product {
  id: number;
  name: string;
  price: number;
  stock: number;
  images: string[];
  category?: string;
}

interface Props {
  product: Product;
  onPress: () => void;
  width?: number;
}

export function ProductCard({ product, onPress, width = 160 }: Props) {
  const colors = useColors();
  const cover = product.images?.[0];

  return (
    <TouchableOpacity onPress={onPress} style={[styles.card, { width, backgroundColor: colors.card, borderColor: colors.border }]}>
      <View style={[styles.imageWrap, { backgroundColor: colors.background }]}>
        {cover ? (
          <Image source={{ uri: cldUrl(cover, "w_400,h_400,c_fill") }} style={styles.img} />
        ) : (
          <View style={[styles.placeholder, { backgroundColor: colors.background }]}>
            <Text style={{ color: colors.mutedForeground, fontSize: 12 }}>No image</Text>
          </View>
        )}
        {product.stock === 0 && (
          <View style={styles.outOfStock}>
            <Text style={{ color: "#fff", fontSize: 11, fontWeight: "600" }}>Out of stock</Text>
          </View>
        )}
      </View>
      <View style={{ padding: 10 }}>
        <Text numberOfLines={2} style={[styles.name, { color: colors.foreground }]}>
          {product.name}
        </Text>
        <View style={{ flexDirection: "row", alignItems: "center", marginTop: 4 }}>
          <Text style={[styles.price, { color: colors.foreground }]}>₹{product.price}</Text>
          {product.category && (
            <Text style={{ fontSize: 10, color: colors.mutedForeground, marginLeft: 8, textTransform: "capitalize" }}>
              · {product.category}
            </Text>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: { borderRadius: 12, borderWidth: 1, overflow: "hidden", marginBottom: 12 },
  imageWrap: { width: "100%", aspectRatio: 1, position: "relative" },
  img: { width: "100%", height: "100%" },
  placeholder: { width: "100%", height: "100%", justifyContent: "center", alignItems: "center" },
  outOfStock: {
    position: "absolute", top: 8, right: 8,
    backgroundColor: "rgba(220,38,38,0.9)",
    paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6,
  },
  name: { fontSize: 13, fontWeight: "500", lineHeight: 18 },
  price: { fontSize: 15, fontWeight: "700" },
});
