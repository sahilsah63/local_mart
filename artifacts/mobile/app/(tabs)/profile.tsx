import { Feather } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React from "react";
import {
  Alert,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { EmptyState } from "@/components/EmptyState";
import { useAuth } from "@/context/AuthContext";
import { useColors } from "@/hooks/useColors";

interface MenuItemProps {
  icon: string;
  label: string;
  onPress: () => void;
  danger?: boolean;
}

function MenuItem({ icon, label, onPress, danger }: MenuItemProps) {
  const colors = useColors();
  return (
    <TouchableOpacity
      style={[styles.menuItem, { borderBottomColor: colors.border }]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={[styles.menuIcon, { backgroundColor: danger ? colors.destructive + "15" : colors.secondary }]}>
        <Feather name={icon as any} size={18} color={danger ? colors.destructive : colors.primary} />
      </View>
      <Text style={[styles.menuLabel, { color: danger ? colors.destructive : colors.foreground }]}>
        {label}
      </Text>
      {!danger && <Feather name="chevron-right" size={18} color={colors.mutedForeground} />}
    </TouchableOpacity>
  );
}

export default function ProfileScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { user, signOut } = useAuth();

  const topPad = Platform.OS === "web" ? 67 : insets.top;

  const handleSignOut = () => {
    Alert.alert("Sign Out", "Are you sure you want to sign out?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Sign Out",
        style: "destructive",
        onPress: signOut,
      },
    ]);
  };

  if (!user) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={{ paddingTop: topPad + 16, paddingHorizontal: 16 }}>
          <Text style={[styles.title, { color: colors.foreground }]}>Profile</Text>
        </View>
        <EmptyState
          icon="user"
          title="You're not signed in"
          subtitle="Sign in or create an account to manage your profile and bookings"
          action={{ label: "Sign In", onPress: () => router.push("/auth/login") }}
        />
      </View>
    );
  }

  const roleLabel =
    user.role === "shop_owner"
      ? "Shop Owner"
      : user.role === "technician"
      ? "Technician"
      : user.role === "admin"
      ? "Admin"
      : "Customer";

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={{ paddingBottom: Platform.OS === "web" ? 34 : insets.bottom + 90 }}
      showsVerticalScrollIndicator={false}
    >
      {/* Header */}
      <View style={[styles.headerWrap, { paddingTop: topPad + 16, backgroundColor: colors.primary }]}>
        <View style={styles.avatarCircle}>
          <Text style={styles.avatarText}>{user.name.charAt(0).toUpperCase()}</Text>
        </View>
        <Text style={styles.userName}>{user.name}</Text>
        <Text style={styles.userEmail}>{user.email}</Text>
        <View style={styles.roleBadge}>
          <Text style={styles.roleText}>{roleLabel}</Text>
        </View>
      </View>

      {/* Info Card */}
      <View style={[styles.infoCard, { backgroundColor: colors.card, borderColor: colors.border, marginHorizontal: 16 }]}>
        {user.phone && (
          <View style={styles.infoRow}>
            <Feather name="phone" size={14} color={colors.mutedForeground} />
            <Text style={[styles.infoText, { color: colors.foreground }]}>{user.phone}</Text>
          </View>
        )}
        {user.address && (
          <View style={styles.infoRow}>
            <Feather name="map-pin" size={14} color={colors.mutedForeground} />
            <Text style={[styles.infoText, { color: colors.foreground }]}>{user.address}</Text>
          </View>
        )}
        <View style={styles.infoRow}>
          <Feather name="calendar" size={14} color={colors.mutedForeground} />
          <Text style={[styles.infoText, { color: colors.mutedForeground }]}>
            Member since {new Date(user.createdAt).toLocaleDateString("en-IN", { month: "long", year: "numeric" })}
          </Text>
        </View>
      </View>

      {/* Menu */}
      <View style={[styles.menuCard, { backgroundColor: colors.card, borderColor: colors.border, marginHorizontal: 16 }]}>
        <MenuItem icon="calendar" label="My Bookings" onPress={() => router.push("/bookings")} />
        <MenuItem icon="search" label="Find Services" onPress={() => router.push("/search")} />
        {user.role === "technician" && (
          <MenuItem icon="tool" label="My Technician Profile" onPress={() => {}} />
        )}
        {user.role === "shop_owner" && (
          <MenuItem icon="shopping-bag" label="My Shop" onPress={() => {}} />
        )}
        <MenuItem icon="log-out" label="Sign Out" onPress={handleSignOut} danger />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  title: { fontSize: 28, fontFamily: "Inter_700Bold", marginBottom: 16 },
  headerWrap: {
    alignItems: "center",
    paddingHorizontal: 16,
    paddingBottom: 32,
    gap: 6,
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
    marginBottom: 20,
  },
  avatarCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "rgba(255,255,255,0.25)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
  },
  avatarText: { fontSize: 36, fontFamily: "Inter_700Bold", color: "#fff" },
  userName: { fontSize: 22, fontFamily: "Inter_700Bold", color: "#fff" },
  userEmail: { fontSize: 14, fontFamily: "Inter_400Regular", color: "rgba(255,255,255,0.8)" },
  roleBadge: {
    marginTop: 4,
    backgroundColor: "rgba(255,255,255,0.2)",
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  roleText: { fontSize: 12, fontFamily: "Inter_600SemiBold", color: "#fff" },
  infoCard: {
    borderWidth: 1,
    borderRadius: 14,
    padding: 14,
    gap: 10,
    marginBottom: 12,
  },
  infoRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  infoText: { fontSize: 14, fontFamily: "Inter_400Regular", flex: 1 },
  menuCard: {
    borderWidth: 1,
    borderRadius: 14,
    overflow: "hidden",
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: 14,
    gap: 12,
    borderBottomWidth: 1,
  },
  menuIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  menuLabel: { flex: 1, fontSize: 15, fontFamily: "Inter_500Medium" },
});
