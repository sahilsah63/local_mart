import { Feather } from "@expo/vector-icons";
import {
  useGetShop,
  useListProducts,
  useListReviews,
  useCreateBooking,
} from "@workspace/api-client-react";
import { useLocalSearchParams, useRouter } from "expo-router";
import * as Haptics from "expo-haptics";
import React, { useState } from "react";
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

import { ProductCard } from "@/components/ProductCard";
import { RatingStars } from "@/components/RatingStars";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import { EmptyState } from "@/components/EmptyState";
import { useAuth } from "@/context/AuthContext";
import { useColors } from "@/hooks/useColors";
import { LiveTrackingMap } from "@/components/LiveTrackingMap";

export default function ShopDetailScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user } = useAuth();
  const shopId = Number(id);

  const { data: shop, isLoading } = useGetShop(shopId);
  const { data: productsData } = useListProducts({
    query: { params: { shopId, limit: 20 } },
  });
  const { data: reviewsData } = useListReviews({
    query: { params: { shopId, limit: 10 } },
  });
  const { mutate: createBooking, isPending: booking } = useCreateBooking({
    mutation: {
      onSuccess: () => {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        Alert.alert("Booking Created", "Your visit has been scheduled!", [
          { text: "View Bookings", onPress: () => router.push("/bookings") },
          { text: "OK" },
        ]);
      },
      onError: (err: any) => {
        Alert.alert("Error", err?.data?.message ?? "Could not create booking");
      },
    },
  });

  const handleBook = () => {
    if (!user) {
      router.push("/auth/login");
      return;
    }
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(11, 0, 0, 0);
    createBooking({
      data: {
        shopId,
        scheduledAt: tomorrow.toISOString(),
        address: shop?.address ?? "",
        notes: "Walk-in visit",
      },
    });
  };

  if (isLoading) return <LoadingSpinner />;
  if (!shop) return <EmptyState icon="shopping-bag" title="Shop not found" />;

  const products = productsData?.products ?? [];
  const reviews = reviewsData?.reviews ?? [];

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={{
        paddingBottom: Platform.OS === "web" ? 34 : insets.bottom + 32,
      }}
      showsVerticalScrollIndicator={false}
    >
      {/* Cover */}
      <View style={[styles.cover, { backgroundColor: colors.primary + "20" }]}>
        <Feather name="shopping-bag" size={64} color={colors.primary} />
        {shop.isVerified && (
          <View
            style={[styles.verifiedBadge, { backgroundColor: colors.primary }]}
          >
            <Feather name="check" size={12} color="#fff" />
            <Text style={styles.verifiedText}>Verified</Text>
          </View>
        )}
      </View>

      <View style={styles.body}>
        {/* Name & Rating */}
        <Text style={[styles.name, { color: colors.foreground }]}>
          {shop.name}
        </Text>
        <RatingStars rating={shop.rating} count={shop.ratingCount} size={16} />

        {/* Info Pills */}
        <View style={styles.infoRow}>
          {shop.phone && (
            <View
              style={[styles.infoPill, { backgroundColor: colors.secondary }]}
            >
              <Feather name="phone" size={13} color={colors.primary} />
              <Text style={[styles.infoPillText, { color: colors.foreground }]}>
                {shop.phone}
              </Text>
            </View>
          )}
          {shop.workingHours && (
            <View
              style={[styles.infoPill, { backgroundColor: colors.secondary }]}
            >
              <Feather name="clock" size={13} color={colors.primary} />
              <Text style={[styles.infoPillText, { color: colors.foreground }]}>
                {shop.workingHours}
              </Text>
            </View>
          )}
        </View>

        {/* Address */}
        <View
          style={[
            styles.addressBox,
            { backgroundColor: colors.muted, borderRadius: 10 },
          ]}
        >
          <Feather name="map-pin" size={16} color={colors.primary} />
          <Text style={[styles.addressText, { color: colors.foreground }]}>
            {shop.address}
          </Text>
        </View>

        {/* Description */}
        {shop.description && (
          <Text style={[styles.desc, { color: colors.mutedForeground }]}>
            {shop.description}
          </Text>
        )}

        {/* Book Button */}
        <TouchableOpacity
          style={[
            styles.bookBtn,
            { backgroundColor: colors.primary, opacity: booking ? 0.7 : 1 },
          ]}
          onPress={handleBook}
          disabled={booking}
        >
          <Feather name="calendar" size={18} color="#fff" />
          <Text style={styles.bookBtnText}>
            {booking ? "Booking..." : "Book a Visit"}
          </Text>
        </TouchableOpacity>

        {/* Products */}
        {products.length > 0 && (
          <>
            <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
              Products
            </Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {products.map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </ScrollView>
          </>
        )}

        {shop?.lat && shop?.lng && (
          <View style={{ marginTop: 16, marginHorizontal: 16 }}>
            <Text style={{ fontSize: 16, fontWeight: "700", marginBottom: 8 }}>
              Location
            </Text>
            <LiveTrackingMap
              height={200}
              points={[
                {
                  lat: shop.lat,
                  lng: shop.lng,
                  label: shop.name,
                  color: "red",
                },
              ]}
            />
          </View>
        )}

        {/* Reviews */}
        <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
          Reviews
        </Text>
        {reviews.length === 0 ? (
          <Text style={[styles.noReviews, { color: colors.mutedForeground }]}>
            No reviews yet.
          </Text>
        ) : (
          reviews.map((rev) => (
            <View
              key={rev.id}
              style={[
                styles.reviewCard,
                { backgroundColor: colors.card, borderColor: colors.border },
              ]}
            >
              <View style={styles.reviewHeader}>
                <Text style={[styles.reviewName, { color: colors.foreground }]}>
                  {rev.userName ?? "User"}
                </Text>
                <RatingStars rating={rev.rating} size={12} />
              </View>
              {rev.comment && (
                <Text
                  style={[
                    styles.reviewComment,
                    { color: colors.mutedForeground },
                  ]}
                >
                  {rev.comment}
                </Text>
              )}
            </View>
          ))
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  cover: { height: 180, alignItems: "center", justifyContent: "center" },
  verifiedBadge: {
    position: "absolute",
    bottom: 12,
    right: 16,
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
  },
  verifiedText: {
    color: "#fff",
    fontSize: 12,
    fontFamily: "Inter_600SemiBold",
  },
  body: { padding: 16, gap: 12 },
  name: { fontSize: 24, fontFamily: "Inter_700Bold" },
  infoRow: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  infoPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  infoPillText: { fontSize: 13, fontFamily: "Inter_400Regular" },
  addressBox: {
    flexDirection: "row",
    alignItems: "flex-start",
    padding: 12,
    gap: 8,
  },
  addressText: {
    flex: 1,
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    lineHeight: 20,
  },
  desc: { fontSize: 14, fontFamily: "Inter_400Regular", lineHeight: 22 },
  bookBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    height: 52,
    borderRadius: 14,
    gap: 8,
  },
  bookBtnText: { fontSize: 16, fontFamily: "Inter_600SemiBold", color: "#fff" },
  sectionTitle: { fontSize: 18, fontFamily: "Inter_700Bold", marginTop: 8 },
  noReviews: {
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    fontStyle: "italic",
  },
  reviewCard: { borderWidth: 1, borderRadius: 12, padding: 12, gap: 6 },
  reviewHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  reviewName: { fontSize: 14, fontFamily: "Inter_600SemiBold" },
  reviewComment: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    lineHeight: 20,
  },
});
