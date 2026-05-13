import { useListShops, useListTechnicians, useListProducts } from "@workspace/api-client-react";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
  FlatList,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { SearchBar } from "@/components/SearchBar";
import { ShopCard } from "@/components/ShopCard";
import { TechnicianCard } from "@/components/TechnicianCard";
import { ProductCard } from "@/components/ProductCard";
import { EmptyState } from "@/components/EmptyState";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import { useColors } from "@/hooks/useColors";

type Tab = "shops" | "technicians" | "products";

export default function SearchScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [activeTab, setActiveTab] = useState<Tab>("shops");

  const topPad = Platform.OS === "web" ? 67 : insets.top;

  const { data: shopsData, isLoading: shopsLoading } = useListShops({
    query: { params: { search: query || undefined, limit: 20 } },
  });
  const { data: techsData, isLoading: techsLoading } = useListTechnicians({
    query: { params: { search: query || undefined, limit: 20 } },
  });
  const { data: productsData, isLoading: productsLoading } = useListProducts({
    query: { params: { search: query || undefined, limit: 20 } },
  });

  const shops = shopsData?.shops ?? [];
  const technicians = techsData?.technicians ?? [];
  const products = productsData?.products ?? [];

  const tabs: { key: Tab; label: string; count: number }[] = [
    { key: "shops", label: "Shops", count: shops.length },
    { key: "technicians", label: "Technicians", count: technicians.length },
    { key: "products", label: "Products", count: products.length },
  ];

  const isLoading =
    (activeTab === "shops" && shopsLoading) ||
    (activeTab === "technicians" && techsLoading) ||
    (activeTab === "products" && productsLoading);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { paddingTop: topPad + 12 }]}>
        <Text style={[styles.title, { color: colors.foreground }]}>Explore</Text>
        <SearchBar
          value={query}
          onChangeText={setQuery}
          placeholder="Search shops, technicians, products..."
        />
        <View style={styles.tabs}>
          {tabs.map((t) => (
            <TouchableOpacity
              key={t.key}
              style={[
                styles.tab,
                {
                  backgroundColor: activeTab === t.key ? colors.primary : colors.card,
                  borderColor: activeTab === t.key ? colors.primary : colors.border,
                },
              ]}
              onPress={() => setActiveTab(t.key)}
            >
              <Text
                style={[
                  styles.tabText,
                  { color: activeTab === t.key ? "#fff" : colors.foreground },
                ]}
              >
                {t.label}
              </Text>
              <View
                style={[
                  styles.tabBadge,
                  {
                    backgroundColor:
                      activeTab === t.key ? "rgba(255,255,255,0.3)" : colors.muted,
                  },
                ]}
              >
                <Text
                  style={[
                    styles.tabBadgeText,
                    { color: activeTab === t.key ? "#fff" : colors.mutedForeground },
                  ]}
                >
                  {t.count}
                </Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {isLoading ? (
        <LoadingSpinner />
      ) : (
        <ScrollView
          contentContainerStyle={[
            styles.list,
            { paddingBottom: Platform.OS === "web" ? 34 : insets.bottom + 90 },
          ]}
          showsVerticalScrollIndicator={false}
        >
          {activeTab === "shops" && (
            <>
              {shops.length === 0 ? (
                <EmptyState icon="shopping-bag" title="No shops found" subtitle="Try a different search term" />
              ) : (
                shops.map((s) => (
                  <ShopCard key={s.id} shop={s} onPress={() => router.push(`/shop/${s.id}`)} />
                ))
              )}
            </>
          )}
          {activeTab === "technicians" && (
            <>
              {technicians.length === 0 ? (
                <EmptyState icon="user" title="No technicians found" subtitle="Try a different search term" />
              ) : (
                technicians.map((t) => (
                  <TechnicianCard key={t.id} technician={t} onPress={() => router.push(`/technician/${t.id}`)} />
                ))
              )}
            </>
          )}
          {activeTab === "products" && (
            <>
              {products.length === 0 ? (
                <EmptyState icon="box" title="No products found" subtitle="Try a different search term" />
              ) : (
                <View style={styles.grid}>
                  {products.map((p) => (
                    <ProductCard key={p.id} product={p} />
                  ))}
                </View>
              )}
            </>
          )}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    paddingHorizontal: 16,
    paddingBottom: 12,
    gap: 12,
  },
  title: { fontSize: 28, fontFamily: "Inter_700Bold" },
  tabs: { flexDirection: "row", gap: 8 },
  tab: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderRadius: 10,
    paddingVertical: 8,
    gap: 4,
  },
  tabText: { fontSize: 13, fontFamily: "Inter_600SemiBold" },
  tabBadge: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 8 },
  tabBadgeText: { fontSize: 11, fontFamily: "Inter_600SemiBold" },
  list: { paddingHorizontal: 16, paddingTop: 8 },
  grid: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
});
