import { useListBookings } from "@workspace/api-client-react";
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

import { BookingCard } from "@/components/BookingCard";
import { EmptyState } from "@/components/EmptyState";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import { useAuth } from "@/context/AuthContext";
import { useColors } from "@/hooks/useColors";

const STATUS_TABS = [
  { key: "", label: "All" },
  { key: "pending", label: "Pending" },
  { key: "confirmed", label: "Confirmed" },
  { key: "in_progress", label: "In Progress" },
  { key: "completed", label: "Done" },
  { key: "cancelled", label: "Cancelled" },
];

export default function BookingsScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { user } = useAuth();
  const [statusFilter, setStatusFilter] = useState("");

  const topPad = Platform.OS === "web" ? 67 : insets.top;

  const { data, isLoading, refetch } = useListBookings({
    query: {
      params: { status: statusFilter || undefined, limit: 50 },
      enabled: !!user,
    },
  });

  const bookings = data?.bookings ?? [];

  if (!user) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={{ paddingTop: topPad + 16, paddingHorizontal: 16 }}>
          <Text style={[styles.title, { color: colors.foreground }]}>My Bookings</Text>
        </View>
        <EmptyState
          icon="calendar"
          title="Sign in to view bookings"
          subtitle="Track your repair bookings and service history"
          action={{ label: "Sign In", onPress: () => router.push("/auth/login") }}
        />
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { paddingTop: topPad + 16 }]}>
        <Text style={[styles.title, { color: colors.foreground }]}>My Bookings</Text>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.filterRow}
      >
        {STATUS_TABS.map((s) => (
          <TouchableOpacity
            key={s.key}
            style={[
              styles.filterPill,
              {
                backgroundColor: statusFilter === s.key ? colors.primary : colors.card,
                borderColor: statusFilter === s.key ? colors.primary : colors.border,
              },
            ]}
            onPress={() => setStatusFilter(s.key)}
          >
            <Text
              style={[
                styles.filterText,
                { color: statusFilter === s.key ? "#fff" : colors.foreground },
              ]}
            >
              {s.label}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {isLoading ? (
        <LoadingSpinner />
      ) : (
        <ScrollView
          contentContainerStyle={[
            styles.list,
            { paddingBottom: Platform.OS === "web" ? 34 : insets.bottom + 90 },
          ]}
          refreshControl={
            <RefreshControl refreshing={false} onRefresh={refetch} tintColor={colors.primary} />
          }
          showsVerticalScrollIndicator={false}
        >
          {bookings.length === 0 ? (
            <EmptyState
              icon="calendar"
              title="No bookings yet"
              subtitle="Book a technician or shop service to get started"
              action={{ label: "Find Technicians", onPress: () => router.push("/search") }}
            />
          ) : (
            bookings.map((b) => (
              <BookingCard key={b.id} booking={b} onPress={() => router.push(`/booking/${b.id}`)} />
            ))
          )}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { paddingHorizontal: 16, paddingBottom: 12 },
  title: { fontSize: 28, fontFamily: "Inter_700Bold" },
  filterRow: { paddingHorizontal: 16, paddingBottom: 12, gap: 8 },
  filterPill: {
    borderWidth: 1,
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 7,
  },
  filterText: { fontSize: 13, fontFamily: "Inter_500Medium" },
  list: { paddingHorizontal: 16, paddingTop: 4 },
});
