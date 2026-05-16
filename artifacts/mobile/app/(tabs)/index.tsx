
import { Feather } from "@expo/vector-icons";
import { useListShops, useListTechnicians } from "@workspace/api-client-react";
import { useFocusEffect, useRouter } from "expo-router";
import React, { useCallback, useState } from "react";
import {
  ActivityIndicator,
  Dimensions,
  Image,
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
import { api } from "@/lib/api";
import { cldUrl } from "@/lib/cloudinary";

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

/* ─────────────────────── CUSTOMER HOME ─────────────────────── */
function CustomerHome() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { user } = useAuth();
  const [activeCategory, setActiveCategory] = useState("all");

  const { data: shopsData, isLoading: sl, refetch: rs } = useListShops({ query: { params: { limit: 10 } } });
  const { data: techsData, isLoading: tl, refetch: rt } = useListTechnicians({ query: { params: { limit: 10, available: true } } });

  const shops = (shopsData as any)?.shops ?? [];
  const technicians = (techsData as any)?.technicians ?? [];
  const isLoading = sl && tl;
  const topPad = Platform.OS === "web" ? 67 : insets.top;

  if (isLoading) return <LoadingSpinner />;

  return (
    <ScrollView
      style={[s.container, { backgroundColor: colors.background }]}
      contentContainerStyle={{ paddingBottom: Platform.OS === "web" ? 34 : insets.bottom + 90 }}
      refreshControl={<RefreshControl refreshing={false} onRefresh={() => { rs(); rt(); }} tintColor={colors.primary} />}
    >
      <View style={[s.header, { paddingTop: topPad + 16 }]}>
        <View>
          <Text style={[s.greeting, { color: colors.mutedForeground }]}>Welcome, {user?.name?.split(" ")[0]}</Text>
          <Text style={[s.headline, { color: colors.foreground }]}>Find Repair Services</Text>
        </View>
        <TouchableOpacity style={[s.notifBtn, { backgroundColor: colors.card, borderColor: colors.border }]} onPress={() => router.push("/profile")}>
          <Feather name="bell" size={20} color={colors.foreground} />
        </TouchableOpacity>
      </View>

      <View style={[s.banner, { backgroundColor: colors.primary, marginHorizontal: 16 }]}>
        <View>
          <Text style={s.bannerTitle}>Quick Repair</Text>
          <Text style={s.bannerSub}>Book a technician near you</Text>
          <TouchableOpacity style={s.bannerBtn} onPress={() => router.push("/search")}>
            <Text style={s.bannerBtnText}>Book Now</Text>
          </TouchableOpacity>
        </View>
        <Feather name="tool" size={64} color="rgba(255,255,255,0.25)" />
      </View>

      <View style={s.sectionHeader}>
        <Text style={[s.sectionTitle, { color: colors.foreground }]}>Categories</Text>
      </View>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.cats}>
        {CATEGORIES.map((cat) => (
          <TouchableOpacity
            key={cat.id}
            style={[s.catPill, { backgroundColor: activeCategory === cat.id ? colors.primary : colors.card, borderColor: activeCategory === cat.id ? colors.primary : colors.border }]}
            onPress={() => setActiveCategory(cat.id)}
          >
            <Feather name={cat.icon as any} size={16} color={activeCategory === cat.id ? "#fff" : colors.mutedForeground} />
            <Text style={[s.catLabel, { color: activeCategory === cat.id ? "#fff" : colors.foreground }]}>{cat.label}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <View style={s.sectionHeader}>
        <Text style={[s.sectionTitle, { color: colors.foreground }]}>Electronics Shops</Text>
        <TouchableOpacity onPress={() => router.push("/search")}>
          <Text style={[s.seeAll, { color: colors.primary }]}>See all</Text>
        </TouchableOpacity>
      </View>
      <View style={{ paddingHorizontal: 16 }}>
        {shops.length === 0
          ? <Text style={[s.empty, { color: colors.mutedForeground }]}>No shops found nearby.</Text>
          : shops.map((shop: any) => <ShopCard key={shop.id} shop={shop} onPress={() => router.push(`/shop/${shop.id}`)} />)}
      </View>

      <View style={s.sectionHeader}>
        <Text style={[s.sectionTitle, { color: colors.foreground }]}>Available Technicians</Text>
        <TouchableOpacity onPress={() => router.push("/search")}>
          <Text style={[s.seeAll, { color: colors.primary }]}>See all</Text>
        </TouchableOpacity>
      </View>
      <View style={{ paddingHorizontal: 16 }}>
        {technicians.length === 0
          ? <Text style={[s.empty, { color: colors.mutedForeground }]}>No technicians available nearby.</Text>
          : technicians.map((t: any) => <TechnicianCard key={t.id} technician={t} onPress={() => router.push(`/technician/${t.id}`)} />)}
      </View>
    </ScrollView>
  );
}

/* ─────────────────────── TECHNICIAN DASHBOARD ─────────────────────── */
function TechnicianDashboard() {
  const colors = useColors();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const topPad = Platform.OS === "web" ? 67 : insets.top;

  const [profile, setProfile] = useState<any>(null);
  const [stats, setStats] = useState({ pending: 0, today: 0, totalEarnings: 0 });
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const me = await api.get<any>("/technicians/my");
      setProfile(me);
      try {
        const bookings = await api.get<any>("/bookings");
        const list = bookings?.bookings ?? bookings ?? [];
        const today = new Date().toDateString();
        setStats({
          pending: list.filter((b: any) => b.status === "pending").length,
          today: list.filter((b: any) => new Date(b.createdAt).toDateString() === today).length,
          totalEarnings: list.filter((b: any) => b.status === "completed").reduce((a: number, b: any) => a + (b.totalAmount || 0), 0),
        });
      } catch {}
    } catch {
      setProfile(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  if (loading) return <LoadingSpinner />;

  // No profile yet → onboarding CTA
  if (!profile) {
    return (
      <ScrollView style={{ flex: 1, backgroundColor: colors.background }} contentContainerStyle={{ padding: 16, paddingTop: topPad + 16 }}>
        <Text style={[s.greeting, { color: colors.mutedForeground }]}>Hello, {user?.name?.split(" ")[0]}</Text>
        <Text style={[s.headline, { color: colors.foreground }]}>Welcome!</Text>
        <View style={[s.banner, { backgroundColor: colors.primary, marginTop: 16 }]}>
          <View style={{ flex: 1 }}>
            <Text style={s.bannerTitle}>Set Up Your Profile</Text>
            <Text style={s.bannerSub}>Add your skills, services & location to start getting bookings.</Text>
            <TouchableOpacity style={s.bannerBtn} onPress={() => router.push("/technician/onboarding")}>
              <Text style={s.bannerBtnText}>Complete Setup</Text>
            </TouchableOpacity>
          </View>
          <Feather name="user-check" size={56} color="rgba(255,255,255,0.25)" />
        </View>
      </ScrollView>
    );
  }

  // Profile exists → rich dashboard
  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.background }}
      contentContainerStyle={{ paddingBottom: insets.bottom + 90, paddingTop: topPad + 16 }}
      refreshControl={<RefreshControl refreshing={false} onRefresh={load} />}
    >
      {/* Profile header */}
      <View style={[s.profileHeader, { backgroundColor: colors.primary }]}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
          {profile.profileImage ? (
            <Image source={{ uri: cldUrl(profile.profileImage, "w_120,h_120,c_fill") }} style={s.avatar} />
          ) : (
            <View style={[s.avatar, { backgroundColor: "rgba(255,255,255,0.2)", justifyContent: "center", alignItems: "center" }]}>
              <Feather name="user" size={28} color="#fff" />
            </View>
          )}
          <View style={{ flex: 1 }}>
            <Text style={s.profileName}>{profile.name}</Text>
            <View style={{ flexDirection: "row", alignItems: "center", marginTop: 4 }}>
              <Feather name="star" size={14} color="#fbbf24" />
              <Text style={s.profileMeta}>{profile.rating?.toFixed(1) ?? "0.0"} · {profile.experienceYears}y exp</Text>
            </View>
          </View>
          <View style={[s.availPill, { backgroundColor: profile.isAvailable ? "#22c55e" : "rgba(255,255,255,0.25)" }]}>
            <View style={[s.availDot, { backgroundColor: "#fff" }]} />
            <Text style={s.availText}>{profile.isAvailable ? "Online" : "Offline"}</Text>
          </View>
        </View>
        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 6, marginTop: 12 }}>
          {(profile.skills ?? []).slice(0, 5).map((sk: string) => (
            <View key={sk} style={s.skillChip}>
              <Text style={s.skillChipText}>{sk}</Text>
            </View>
          ))}
        </View>
      </View>

      {/* Stats row */}
      <View style={s.statsRow}>
        <StatCard icon="clock"   value={String(stats.pending)} label="Pending" colors={colors} />
        <StatCard icon="calendar" value={String(stats.today)}   label="Today"   colors={colors} />
        <StatCard icon="rupee-sign" value={`₹${stats.totalEarnings}`} label="Earned" colors={colors} useMaterial />
      </View>

      {/* Quick actions */}
      <View style={{ padding: 16 }}>
        <Text style={[s.sectionTitle, { color: colors.foreground, marginBottom: 8 }]}>Manage</Text>
        <ActionRow icon="briefcase" label="View My Jobs"        onPress={() => router.push("/bookings")} colors={colors} />
        <ActionRow icon="map-pin"   label="Update Availability"  onPress={() => router.push("/technician/onboarding")} colors={colors} />
        <ActionRow icon="edit-3"    label="Edit Profile"         onPress={() => router.push("/technician/onboarding")} colors={colors} />
        <ActionRow icon="star"      label="My Reviews"           onPress={() => router.push("/profile")} colors={colors} />
        <ActionRow icon="dollar-sign" label="Earnings & Payouts" onPress={() => router.push("/bookings")} colors={colors} />
      </View>
    </ScrollView>
  );
}

/* ─────────────────────── SHOP OWNER DASHBOARD ─────────────────────── */
function ShopOwnerDashboard() {
  const colors = useColors();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const topPad = Platform.OS === "web" ? 67 : insets.top;

  const [shop, setShop] = useState<any>(null);
  const [stats, setStats] = useState({ products: 0, totalOrders: 0, revenue: 0 });
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const me = await api.get<any>("/shops/my");
      setShop(me);
      try {
        const productsRes = await api.get<any>(`/products?shopId=${me.id}&limit=200`);
        const products = productsRes?.products ?? productsRes ?? [];
        setStats((p) => ({ ...p, products: products.length }));
      } catch {}
    } catch {
      setShop(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  if (loading) return <LoadingSpinner />;

  // No shop yet → onboarding CTA
  if (!shop) {
    return (
      <ScrollView style={{ flex: 1, backgroundColor: colors.background }} contentContainerStyle={{ padding: 16, paddingTop: topPad + 16 }}>
        <Text style={[s.greeting, { color: colors.mutedForeground }]}>Hello, {user?.name?.split(" ")[0]}</Text>
        <Text style={[s.headline, { color: colors.foreground }]}>Welcome!</Text>
        <View style={[s.banner, { backgroundColor: colors.primary, marginTop: 16 }]}>
          <View style={{ flex: 1 }}>
            <Text style={s.bannerTitle}>Register Your Shop</Text>
            <Text style={s.bannerSub}>List your shop on the marketplace and start selling.</Text>
            <TouchableOpacity style={s.bannerBtn} onPress={() => router.push("/shop/onboarding")}>
              <Text style={s.bannerBtnText}>Get Started</Text>
            </TouchableOpacity>
          </View>
          <Feather name="shopping-bag" size={56} color="rgba(255,255,255,0.25)" />
        </View>
      </ScrollView>
    );
  }

  // Shop exists → rich dashboard
  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.background }}
      contentContainerStyle={{ paddingBottom: insets.bottom + 90, paddingTop: topPad + 16 }}
      refreshControl={<RefreshControl refreshing={false} onRefresh={load} />}
    >
      {/* Shop banner */}
      <View style={[s.profileHeader, { backgroundColor: colors.primary }]}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
          {shop.images?.[0] ? (
            <Image source={{ uri: cldUrl(shop.images[0], "w_120,h_120,c_fill") }} style={s.avatar} />
          ) : (
            <View style={[s.avatar, { backgroundColor: "rgba(255,255,255,0.2)", justifyContent: "center", alignItems: "center" }]}>
              <Feather name="shopping-bag" size={28} color="#fff" />
            </View>
          )}
          <View style={{ flex: 1 }}>
            <Text style={s.profileName}>{shop.name}</Text>
            <Text style={s.profileMeta} numberOfLines={1}>{shop.address}</Text>
            <View style={{ flexDirection: "row", alignItems: "center", marginTop: 4 }}>
              <Feather name="star" size={14} color="#fbbf24" />
              <Text style={s.profileMeta}>{shop.rating?.toFixed(1) ?? "0.0"} · {shop.category ?? "General"}</Text>
            </View>
          </View>
        </View>
      </View>

      {/* Stats row */}
      <View style={s.statsRow}>
        <StatCard icon="package"  value={String(stats.products)}   label="Products" colors={colors} />
        <StatCard icon="shopping-cart" value={String(stats.totalOrders)} label="Orders"   colors={colors} />
        <StatCard icon="dollar-sign"   value={`₹${stats.revenue}`}        label="Revenue"  colors={colors} />
      </View>

      {/* Quick actions */}
      <View style={{ padding: 16 }}>
        <Text style={[s.sectionTitle, { color: colors.foreground, marginBottom: 8 }]}>Manage</Text>
        <ActionRow icon="package"       label="Manage Products"  onPress={() => router.push("/shop/product")} colors={colors} highlight />
        <ActionRow icon="plus-circle"   label="Add New Product"  onPress={() => router.push({ pathname: "/shop/product-form", params: { shopId: String(shop.id) } })} colors={colors} />
        <ActionRow icon="shopping-bag"  label="View Orders"      onPress={() => router.push("/bookings")} colors={colors} />
        <ActionRow icon="bar-chart-2"   label="Sales Analytics"  onPress={() => router.push("/bookings")} colors={colors} />
        <ActionRow icon="star"          label="Customer Reviews" onPress={() => router.push("/profile")} colors={colors} />
        <ActionRow icon="edit-3"        label="Edit Shop Info"   onPress={() => router.push("/shop/onboarding")} colors={colors} />
      </View>
    </ScrollView>
  );
}

/* ─────────────────────── HELPERS ─────────────────────── */
function StatCard({ icon, value, label, colors, useMaterial }: any) {
  return (
    <View style={[s.statCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <Feather name={useMaterial ? "dollar-sign" : icon} size={18} color={colors.primary} />
      <Text style={[s.statValue, { color: colors.foreground }]}>{value}</Text>
      <Text style={[s.statLabel, { color: colors.mutedForeground }]}>{label}</Text>
    </View>
  );
}

function ActionRow({ icon, label, onPress, colors, highlight }: any) {
  return (
    <TouchableOpacity
      onPress={onPress}
      style={{
        flexDirection: "row", alignItems: "center", padding: 14, marginTop: 8,
        backgroundColor: highlight ? colors.primary + "15" : colors.card,
        borderRadius: 12, borderWidth: 1, borderColor: highlight ? colors.primary + "40" : colors.border,
      }}
    >
      <Feather name={icon} size={20} color={colors.primary} />
      <Text style={{ flex: 1, marginLeft: 12, fontSize: 15, fontFamily: "Inter_500Medium", color: colors.foreground }}>{label}</Text>
      <Feather name="chevron-right" size={18} color={colors.mutedForeground} />
    </TouchableOpacity>
  );
}

const s = StyleSheet.create({
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

  profileHeader: { padding: 16, marginHorizontal: 16, marginBottom: 16, borderRadius: 16 },
  avatar: { width: 60, height: 60, borderRadius: 30 },
  profileName: { fontSize: 20, color: "#fff", fontFamily: "Inter_700Bold" },
  profileMeta: { fontSize: 12, color: "rgba(255,255,255,0.85)", marginLeft: 4 },
  availPill: { flexDirection: "row", alignItems: "center", paddingHorizontal: 10, paddingVertical: 5, borderRadius: 14, gap: 5 },
  availDot: { width: 6, height: 6, borderRadius: 3 },
  availText: { color: "#fff", fontSize: 11, fontWeight: "700" },
  skillChip: { backgroundColor: "rgba(255,255,255,0.2)", paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  skillChipText: { color: "#fff", fontSize: 11, textTransform: "capitalize" },

  statsRow: { flexDirection: "row", paddingHorizontal: 16, gap: 8 },
  statCard: { flex: 1, padding: 12, borderRadius: 12, borderWidth: 1, alignItems: "flex-start" },
  statValue: { fontSize: 18, fontFamily: "Inter_700Bold", marginTop: 8 },
  statLabel: { fontSize: 11, fontFamily: "Inter_400Regular", marginTop: 2 },
});
