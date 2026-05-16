import { Feather } from "@expo/vector-icons";
import { useFocusEffect, useRouter } from "expo-router";
import React, { useCallback, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Platform,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useColors } from "@/hooks/useColors";
import { api } from "@/lib/api";

interface Product {
  id: number;
  name: string;
  description?: string;
  price: number;
  stock: number;
  category?: string;
  isActive: boolean;
  images: string[];
}

export default function ShopProducts() {
  const colors = useColors();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [shopId, setShopId] = useState<number | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    try {
      const shop = await api.get<{ id: number }>("/shops/my");
      setShopId(shop.id);
      const data = await api.get<any>(`/products?shopId=${shop.id}&limit=200`);
      const productsList = data?.products ?? data ?? [];
      setProducts(productsList);
    } catch (e: any) {
      Alert.alert(
        "Couldn't load products",
        e?.message ?? "Make sure you've registered your shop first.",
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  const onDelete = (productId: number) => {
    Alert.alert("Delete product?", "This cannot be undone.", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          try {
            await api.del(`/products/${productId}`);
            setProducts((p) => p.filter((x) => x.id !== productId));
          } catch (e: any) {
            Alert.alert("Delete failed", e?.message ?? "Try again");
          }
        },
      },
    ]);
  };

  if (loading)
    return (
      <View style={{ flex: 1, justifyContent: "center" }}>
        <ActivityIndicator />
      </View>
    );

  const topPad = Platform.OS === "web" ? 16 : insets.top + 16;

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <View
        style={{
          padding: 16,
          paddingTop: topPad,
          flexDirection: "row",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <View>
          <Text
            style={{
              fontSize: 22,
              fontWeight: "700",
              color: colors.foreground,
            }}
          >
            My Products
          </Text>
          <Text
            style={{
              fontSize: 13,
              color: colors.mutedForeground,
              marginTop: 2,
            }}
          >
            {products.length} {products.length === 1 ? "product" : "products"}{" "}
            listed
          </Text>
        </View>
        <TouchableOpacity
          onPress={() =>
            router.push({
              pathname: "/shop/product-form",
              params: { shopId: String(shopId ?? "") },
            })
          }
          style={{
            backgroundColor: colors.primary,
            paddingHorizontal: 14,
            paddingVertical: 10,
            borderRadius: 10,
            flexDirection: "row",
            alignItems: "center",
          }}
        >
          <Feather name="plus" size={16} color="#fff" />
          <Text style={{ color: "#fff", fontWeight: "600", marginLeft: 4 }}>
            Add
          </Text>
        </TouchableOpacity>
      </View>

      {products.length === 0 ? (
        <View
          style={{
            flex: 1,
            justifyContent: "center",
            alignItems: "center",
            padding: 24,
          }}
        >
          <Feather name="package" size={56} color={colors.mutedForeground} />
          <Text
            style={{ marginTop: 16, fontSize: 16, color: colors.foreground }}
          >
            No products yet
          </Text>
          <Text
            style={{
              marginTop: 4,
              fontSize: 13,
              color: colors.mutedForeground,
              textAlign: "center",
            }}
          >
            Tap "Add" to list your first product.
          </Text>
        </View>
      ) : (
        <FlatList
          data={products}
          keyExtractor={(p) => String(p.id)}
          contentContainerStyle={{
            padding: 16,
            paddingBottom: insets.bottom + 100,
          }}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => {
                setRefreshing(true);
                load();
              }}
            />
          }
          renderItem={({ item }) => (
            <View
              style={[
                styles.card,
                { backgroundColor: colors.card, borderColor: colors.border },
              ]}
            >
              <View style={{ flex: 1 }}>
                <Text
                  style={{
                    fontSize: 15,
                    fontWeight: "600",
                    color: colors.foreground,
                  }}
                >
                  {item.name}
                </Text>
                {item.description && (
                  <Text
                    style={{
                      fontSize: 12,
                      color: colors.mutedForeground,
                      marginTop: 2,
                    }}
                    numberOfLines={2}
                  >
                    {item.description}
                  </Text>
                )}
                <View style={{ flexDirection: "row", marginTop: 8, gap: 8 }}>
                  <Tag text={`₹${item.price}`} color={colors.primary} />
                  <Tag
                    text={`Stock: ${item.stock}`}
                    color={item.stock > 0 ? "#16a34a" : "#dc2626"}
                  />
                  {item.category && (
                    <Tag text={item.category} color={colors.mutedForeground} />
                  )}
                  {!item.isActive && <Tag text="Hidden" color="#f59e0b" />}
                </View>
              </View>
              <View style={{ gap: 8 }}>
                <TouchableOpacity
                  onPress={() =>
                    router.push({
                      pathname: "/shop/product-form",
                      params: {
                        shopId: String(shopId ?? ""),
                        productId: String(item.id),
                      },
                    })
                  }
                  style={[
                    styles.iconBtn,
                    {
                      backgroundColor: colors.background,
                      borderColor: colors.border,
                    },
                  ]}
                >
                  <Feather name="edit-2" size={14} color={colors.foreground} />
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => onDelete(item.id)}
                  style={[
                    styles.iconBtn,
                    {
                      backgroundColor: colors.background,
                      borderColor: colors.border,
                    },
                  ]}
                >
                  <Feather name="trash-2" size={14} color="#dc2626" />
                </TouchableOpacity>
              </View>
            </View>
          )}
        />
      )}
    </View>
  );
}

function Tag({ text, color }: { text: string; color: string }) {
  return (
    <View
      style={{
        backgroundColor: color + "22",
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderRadius: 6,
      }}
    >
      <Text style={{ color, fontSize: 11, fontWeight: "600" }}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: "row",
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 10,
    gap: 12,
  },
  iconBtn: {
    width: 32,
    height: 32,
    borderRadius: 8,
    borderWidth: 1,
    justifyContent: "center",
    alignItems: "center",
  },
});
