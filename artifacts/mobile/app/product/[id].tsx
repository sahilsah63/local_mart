import { Feather } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Dimensions,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { cldUrl } from "@/lib/cloudinary";
import { api } from "@/lib/api";
import { useColors } from "@/hooks/useColors";

const SCREEN_W = Dimensions.get("window").width;

interface Product {
  id: number;
  shopId: number;
  name: string;
  description?: string;
  price: number;
  stock: number;
  category?: string;
  images: string[];
  isActive: boolean;
}

interface Shop {
  id: number;
  name: string;
  address: string;
  phone?: string;
  rating: number;
}

export default function ProductDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const colors = useColors();
  const insets = useSafeAreaInsets();

  const [product, setProduct] = useState<Product | null>(null);
  const [shop, setShop] = useState<Shop | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeImage, setActiveImage] = useState(0);

  useEffect(() => {
    (async () => {
      try {
        const p = await api.get<Product>(`/products/${id}`);
        setProduct(p);
        if (p?.shopId) {
          try {
            const s = await api.get<Shop>(`/shops/${p.shopId}`);
            setShop(s);
          } catch {}
        }
      } catch (e: any) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: colors.background }}>
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }

  if (!product) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: colors.background }}>
        <Text style={{ color: colors.mutedForeground }}>Product not found.</Text>
      </View>
    );
  }

  const images = product.images?.length ? product.images : [];

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <ScrollView contentContainerStyle={{ paddingBottom: insets.bottom + 90 }}>
        {/* Image carousel */}
        <View style={{ height: SCREEN_W, backgroundColor: colors.card }}>
          {images.length > 0 ? (
            <ScrollView
              horizontal
              pagingEnabled
              showsHorizontalScrollIndicator={false}
              onMomentumScrollEnd={(e) => {
                const idx = Math.round(e.nativeEvent.contentOffset.x / SCREEN_W);
                setActiveImage(idx);
              }}
            >
              {images.map((url, i) => (
                <Image
                  key={i}
                  source={{ uri: cldUrl(url, "w_1000,q_auto,f_auto") }}
                  style={{ width: SCREEN_W, height: SCREEN_W }}
                  resizeMode="contain"
                />
              ))}
            </ScrollView>
          ) : (
            <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
              <Feather name="image" size={64} color={colors.mutedForeground} />
              <Text style={{ color: colors.mutedForeground, marginTop: 8 }}>No image</Text>
            </View>
          )}
          {images.length > 1 && (
            <View style={styles.dots}>
              {images.map((_, i) => (
                <View
                  key={i}
                  style={[
                    styles.dot,
                    {
                      backgroundColor: i === activeImage ? colors.primary : "rgba(255,255,255,0.5)",
                      width: i === activeImage ? 18 : 6,
                    },
                  ]}
                />
              ))}
            </View>
          )}
        </View>

        {/* Details */}
        <View style={{ padding: 16 }}>
          <Text style={[styles.name, { color: colors.foreground }]}>{product.name}</Text>
          <View style={{ flexDirection: "row", alignItems: "baseline", marginTop: 8 }}>
            <Text style={[styles.price, { color: colors.foreground }]}>₹{product.price}</Text>
            {product.category && (
              <View style={[styles.catTag, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <Text style={{ color: colors.mutedForeground, fontSize: 12, textTransform: "capitalize" }}>
                  {product.category}
                </Text>
              </View>
            )}
          </View>

          <View style={{ flexDirection: "row", marginTop: 12, gap: 12 }}>
            <Tag
              label={product.stock > 0 ? `${product.stock} in stock` : "Out of stock"}
              color={product.stock > 0 ? "#16a34a" : "#dc2626"}
            />
          </View>

          {product.description && (
            <>
              <Text style={[styles.sectionTitle, { color: colors.foreground }]}>About this product</Text>
              <Text style={[styles.description, { color: colors.mutedForeground }]}>{product.description}</Text>
            </>
          )}

          {shop && (
            <TouchableOpacity
              onPress={() => router.push(`/shop/${shop.id}`)}
              style={[styles.shopCard, { borderColor: colors.border, backgroundColor: colors.card }]}
            >
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 11, color: colors.mutedForeground }}>SOLD BY</Text>
                <Text style={{ fontSize: 15, fontWeight: "600", color: colors.foreground, marginTop: 2 }}>
                  {shop.name}
                </Text>
                <Text style={{ fontSize: 12, color: colors.mutedForeground, marginTop: 2 }}>{shop.address}</Text>
              </View>
              <Feather name="chevron-right" size={20} color={colors.mutedForeground} />
            </TouchableOpacity>
          )}
        </View>
      </ScrollView>

      {/* Bottom action bar */}
      <View
        style={[
          styles.bottomBar,
          { borderColor: colors.border, backgroundColor: colors.background, paddingBottom: insets.bottom + 10 },
        ]}
      >
        <TouchableOpacity
          disabled={product.stock === 0}
          style={[styles.cta, { backgroundColor: product.stock === 0 ? colors.mutedForeground : colors.primary }]}
        >
          <Feather name="phone" size={16} color="#fff" />
          <Text style={{ color: "#fff", fontWeight: "700", marginLeft: 8 }}>
            {product.stock === 0 ? "Out of stock" : "Contact Shop"}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

function Tag({ label, color }: { label: string; color: string }) {
  return (
    <View style={{ backgroundColor: color + "22", paddingHorizontal: 10, paddingVertical: 5, borderRadius: 6 }}>
      <Text style={{ color, fontSize: 11, fontWeight: "600" }}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  name: { fontSize: 22, fontWeight: "700", lineHeight: 28 },
  price: { fontSize: 28, fontWeight: "800" },
  catTag: { marginLeft: 10, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6, borderWidth: 1 },
  sectionTitle: { fontSize: 16, fontWeight: "700", marginTop: 24, marginBottom: 8 },
  description: { fontSize: 14, lineHeight: 22 },
  shopCard: {
    flexDirection: "row", alignItems: "center", marginTop: 24,
    padding: 14, borderRadius: 12, borderWidth: 1,
  },
  dots: {
    position: "absolute", bottom: 14, left: 0, right: 0,
    flexDirection: "row", justifyContent: "center", gap: 6,
  },
  dot: { height: 6, borderRadius: 3 },
  bottomBar: {
    position: "absolute", bottom: 0, left: 0, right: 0,
    padding: 12, paddingTop: 14, borderTopWidth: 1,
  },
  cta: { flexDirection: "row", justifyContent: "center", alignItems: "center", padding: 14, borderRadius: 10 },
});
