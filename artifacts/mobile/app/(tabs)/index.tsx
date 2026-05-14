import { Feather } from "@expo/vector-icons";
import { useListShops, useListTechnicians } from "@workspace/api-client-react";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
  Platform,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { ShopCard } from "@/components/ShopCard";
import { TechnicianCard } from "@/components/TechnicianCard";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import { useAuth } from "@/context/AuthContext";
import { useColors } from "@/hooks/useColors";

const CATEGORIES = [
  { id: "all", label: "All", icon: "grid" },
  { id: "mobile", label: "Mobile", icon: "smartphone" },
  { id: "laptop", label: "Laptop", icon: "monitor" },
  { id: "tv", label: "TV", icon: "tv" },
  { id: "ac", label: "AC", icon: "wind" },
];

export default function HomeScreen() {
  const { user } = useAuth();
  if (user?.role === "technician") return <TechnicianDashboard />;
  if (user?.role === "shop_owner") return <ShopOwnerDashboard />;
  return <CustomerHome />;
}

function CustomerHome() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { user } = useAuth();
  const [activeCategory, setActiveCategory] = useState("all");

  const { data: shopsData, isLoading: shopsLoading, refetch: refetchShops } = useListShops({
    query: { params: { limit: 10 } },
  });
  const { data: techsData, isLoading: techsLoading, refetch: refetchTechs } = useListTechnicians({
    query: { params: { limit: 10, available: true } },
  });

  const shops = (shopsData as any)?.shops ?? [];
  const technicians = (techsData as any)?.technicians ?? [];
  const isLoading = shopsLoading && techsLoading;

  const topPad = Platform.OS === "web" ? 67 : insets.top;

  if (isLoading) return <LoadingSpinner />;

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={{ paddingBottom: Platform.OS === "web" ? 34 : insets.bottom + 90 }}
      refreshControl={
        <RefreshControl refreshing={false} onRefresh={() => { refetchShops(); refetchTechs(); }} tintColor={colors.primary} />
      }
      showsVerticalScrollIndicator={false}
    >
      <View style={[styles.header, { paddingTop: topPad + 16, backgroundColor: colors.background }]}>
        <View>
          <Text style={[styles.greeting, { color: colors.mutedForeground }]}>
            {user ? `Welcome, ${user.name.split(" ")[0]}` : "Welcome back"}
          </Text>
          <Text style={[styles.headline, { color: colors.foreground }]}>Find Repair Services</Text>
        </View>
        <TouchableOpacity
          style={[styles.notifBtn, { backgroundColor: colors.card, borderColor: colors.border }]}
          onPress={() => router.push("/profile")}
        >
          <Feather name="bell" size={20} color={colors.foreground} />
        </TouchableOpacity>
      </View>

      <View style={[styles.banner, { backgroundColor: colors.primary, marginHorizontal: 16 }]}>
        <View>
          <Text style={styles.bannerTitle}>Quick Repair</Text>
          <Text style={styles.bannerSub}>Book a technician near you</Text>
          <TouchableOpacity style={styles.bannerBtn} onPress={() => router.push("/search")}>
            <Text style={styles.bannerBtnText}>Book Now</Text>
          </TouchableOpacity>
        </View>
        <Feather name="tool" size={64} color="rgba(255,255,255,0.25)" />
      </View>

      <View style={styles.sectionHeader}>
        <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Categories</Text>
      </View>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.cats}>
        {CATEGORIES.map((cat) => (
          <TouchableOpacity
            key={cat.id}
            style={[styles.catPill, {
              backgroundColor: activeCategory === cat.id ? colors.primary : colors.card,
              borderColor: activeCategory === cat.id ? colors.primary : colors.border,
            }]}
            onPress={() => setActiveCategory(cat.id)}
          >
            <Feather name={cat.icon as any} size={16} color={activeCategory === cat.id ? "#fff" : colors.mutedForeground} />
            <Text style={[styles.catLabel, { color: activeCategory === cat.id ? "#fff" : colors.foreground }]}>{cat.label}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <View style={styles.sectionHeader}>
        <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Electronics Shops</Text>
        <TouchableOpacity onPress={() => router.push("/search")}>
          <Text style={[styles.seeAll, { color: colors.primary }]}>See all</Text>
        </TouchableOpacity>
      </View>
      <View style={{ paddingHorizontal: 16 }}>
        {shops.length === 0
          ? <Text style={[styles.empty, { color: colors.mutedForeground }]}>No shops found nearby.</Text>
          : shops.map((shop: any) => (
              <ShopCard key={shop.id} shop={shop} onPress={() => router.push(`/shop/${shop.id}`)} />
            ))}
      </View>

      <View style={styles.sectionHeader}>
        <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Available Technicians</Text>
        <TouchableOpacity onPress={() => router.push("/search")}>
          <Text style={[styles.seeAll, { color: colors.primary }]}>See all</Text>
        </TouchableOpacity>
      </View>
      <View style={{ paddingHorizontal: 16 }}>
        {technicians.length === 0
          ? <Text style={[styles.empty, { color: colors.mutedForeground }]}>No technicians available nearby.</Text>
          : technicians.map((tech: any) => (
              <TechnicianCard key={tech.id} technician={tech} onPress={() => router.push(`/technician/${tech.id}`)} />
            ))}
      </View>
    </ScrollView>
  );
}

function TechnicianDashboard() {
  const colors = useColors();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const topPad = Platform.OS === "web" ? 67 : insets.top;

  return (
    <ScrollView style={{ flex: 1, backgroundColor: colors.background }} contentContainerStyle={{ padding: 16, paddingTop: topPad + 16 }}>
      <Text style={[styles.greeting, { color: colors.mutedForeground }]}>Hello, {user?.name?.split(" ")[0]}</Text>
      <Text style={[styles.headline, { color: colors.foreground }]}>Technician Dashboard</Text>

      <View style={[styles.banner, { backgroundColor: colors.primary, marginTop: 16 }]}>
        <View style={{ flex: 1 }}>
          <Text style={styles.bannerTitle}>Set Up Your Profile</Text>
          <Text style={styles.bannerSub}>Add your skills, services & location to start getting bookings.</Text>
          <TouchableOpacity style={styles.bannerBtn} onPress={() => router.push("/technician/onboarding")}>
            <Text style={styles.bannerBtnText}>Complete Setup</Text>
          </TouchableOpacity>
        </View>
        <Feather name="user-check" size={56} color="rgba(255,255,255,0.25)" />
      </View>

      <View style={{ marginTop: 24 }}>
        <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Quick Actions</Text>
        <DashboardLink icon="briefcase" label="View My Jobs"    onPress={() => router.push("/bookings")} colors={colors} />
        <DashboardLink icon="user"      label="Edit My Profile" onPress={() => router.push("/technician/onboarding")} colors={colors} />
      </View>
    </ScrollView>
  );
}

function ShopOwnerDashboard() {
  const colors = useColors();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const topPad = Platform.OS === "web" ? 67 : insets.top;

  return (
    <ScrollView style={{ flex: 1, backgroundColor: colors.background }} contentContainerStyle={{ padding: 16, paddingTop: topPad + 16 }}>
      <Text style={[styles.greeting, { color: colors.mutedForeground }]}>Hello, {user?.name?.split(" ")[0]}</Text>
      <Text style={[styles.headline, { color: colors.foreground }]}>My Shop</Text>

      <View style={[styles.banner, { backgroundColor: colors.primary, marginTop: 16 }]}>
        <View style={{ flex: 1 }}>
          <Text style={styles.bannerTitle}>Register Your Shop</Text>
          <Text style={styles.bannerSub}>List your shop on the marketplace and start selling.</Text>
          <TouchableOpacity style={styles.bannerBtn} onPress={() => router.push("/shop/onboarding")}>
            <Text style={styles.bannerBtnText}>Get Started</Text>
          </TouchableOpacity>
        </View>
        <Feather name="shopping-bag" size={56} color="rgba(255,255,255,0.25)" />
      </View>

      <View style={{ marginTop: 24 }}>
        <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Quick Actions</Text>
        <DashboardLink icon="package"      label="Manage Products" onPress={() => router.push("/shop/product")} colors={colors} />
        <DashboardLink icon="shopping-bag" label="View Orders"     onPress={() => router.push("/bookings")} colors={colors} />
        <DashboardLink icon="settings"     label="Edit Shop Info"  onPress={() => router.push("/shop/onboarding")} colors={colors} />
      </View>
    </ScrollView>
  );
}

function DashboardLink({ icon, label, onPress, colors }: any) {
  return (
    <TouchableOpacity
      onPress={onPress}
      style={{
        flexDirection: "row", alignItems: "center", padding: 14, marginTop: 8,
        backgroundColor: colors.card, borderRadius: 12, borderWidth: 1, borderColor: colors.border,
      }}
    >
      <Feather name={icon} size={20} color={colors.primary} />
      <Text style={{ flex: 1, marginLeft: 12, fontSize: 15, fontFamily: "Inter_500Medium", color: colors.foreground }}>{label}</Text>
      <Feather name="chevron-right" size={18} color={colors.mutedForeground} />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", paddingHorizontal: 16, paddingBottom: 16 },
  greeting: { fontSize: 14, fontFamily: "Inter_400Regular" },
  headline: { fontSize: 24, fontFamily: "Inter_700Bold", marginTop: 2 },
  notifBtn: { width: 42, height: 42, borderRadius: 21, borderWidth: 1, alignItems: "center", justifyContent: "center" },
  banner: { borderRadius: 16, padding: 20, marginBottom: 20, flexDirection: "row", justifyContent: "space-between", alignItems: "center", overflow: "hidden" },
  bannerTitle: { fontSize: 20, fontFamily: "Inter_700Bold", color: "#fff" },
  bannerSub: { fontSize: 13, fontFamily: "Inter_400Regular", color: "rgba(255,255,255,0.85)", marginTop: 4 },
  bannerBtn: { marginTop: 12, backgroundColor: "#fff", paddingHorizontal: 16, paddingVertical: 8, borderRadius: 8, alignSelf: "flex-start" },
  bannerBtnText: { fontSize: 13, fontFamily: "Inter_600SemiBold", color: "#1a56db" },
  sectionHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingHorizontal: 16, marginBottom: 10, marginTop: 4 },
  sectionTitle: { fontSize: 18, fontFamily: "Inter_700Bold" },
  seeAll: { fontSize: 13, fontFamily: "Inter_500Medium" },
  cats: { paddingHorizontal: 16, paddingBottom: 12, gap: 8 },
  catPill: { flexDirection: "row", alignItems: "center", borderWidth: 1, borderRadius: 20, paddingHorizontal: 14, paddingVertical: 8, gap: 6 },
  catLabel: { fontSize: 13, fontFamily: "Inter_500Medium" },
  empty: { fontSize: 14, fontFamily: "Inter_400Regular", textAlign: "center", paddingVertical: 20 },
});
