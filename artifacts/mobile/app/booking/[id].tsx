import { Feather } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import * as Haptics from "expo-haptics";
import React, { useState } from "react";
import {
  Alert,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { LoadingSpinner } from "@/components/LoadingSpinner";
import { EmptyState } from "@/components/EmptyState";
import { useAuth } from "@/context/AuthContext";
import { useColors } from "@/hooks/useColors";

import { useLiveLocation } from "@/hooks/useLiveLocation";
import { useBookingLocations, distanceKm, etaMinutes } from "../../hooks/useBookingLocation";
import { LiveTrackingMap } from "@/components/LiveTrackingMap";

const STATUS_COLORS: Record<string, string> = {
  pending: "#f59e0b",
  confirmed: "#3b82f6",
  in_progress: "#8b5cf6",
  completed: "#10b981",
  cancelled: "#ef4444",
};

export default function BookingDetailScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user } = useAuth();
  const bookingId = Number(id);

const TRACK_STATUSES = ["confirmed", "accepted", "in_progress", "en_route"];

// 1) Fetch booking locations every 10s
const { data: liveData } = useBookingLocations(
  bookingId,
  // Enable only if booking status is "active". Adjust per your statuses.
  !!booking && TRACK_STATUSES.includes(booking.status)
);

// 2) Push my location every 15s while booking is active
useLiveLocation({
  enabled: !!booking && TRACK_STATUSES.includes(booking.status),
  intervalMs: 15000,
});


  const { data: booking, isLoading } = useBookingLocations(bookingId);
  const { mutate: updateStatus } = useUpdateBookingStatus({
    mutation: {
      onSuccess: () => {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        Alert.alert("Updated", "Booking status updated.");
      },
    },
  });
  const { mutate: submitReview, isPending: submittingReview } = useCreateReview({
    mutation: {
      onSuccess: () => {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        Alert.alert("Review Submitted", "Thank you for your feedback!");
        setShowReview(false);
      },
      onError: (err: any) => {
        Alert.alert("Error", err?.data?.message ?? "Could not submit review");
      },
    },
  });

  const [showReview, setShowReview] = useState(false);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState("");

  if (isLoading) return <LoadingSpinner />;
  if (!booking) return <EmptyState icon="calendar" title="Booking not found" />;

  const statusColor = STATUS_COLORS[booking.status] ?? colors.mutedForeground;
  const canCancel = booking.status === "pending" || booking.status === "confirmed";
  const canReview = booking.status === "completed";

  const handleCancel = () => {
    Alert.alert("Cancel Booking", "Are you sure you want to cancel?", [
      { text: "No", style: "cancel" },
      {
        text: "Cancel Booking",
        style: "destructive",
        onPress: () => updateStatus({ id: bookingId, data: { status: "cancelled" } }),
      },
    ]);
  };

  const handleReview = () => {
    if (!booking.technicianId && !booking.shopId) return;
    submitReview({
      data: {
        bookingId,
        technicianId: booking.technicianId ?? undefined,
        shopId: booking.shopId ?? undefined,
        rating: reviewRating,
        comment: reviewComment || undefined,
      },
    });
  };

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={{ paddingBottom: Platform.OS === "web" ? 34 : insets.bottom + 32 }}
      showsVerticalScrollIndicator={false}
    >
      {/* Status Header */}
      <View style={[styles.statusHeader, { backgroundColor: statusColor + "15" }]}>
        <View style={[styles.statusIcon, { backgroundColor: statusColor + "25" }]}>
          <Feather name="calendar" size={28} color={statusColor} />
        </View>
        <Text style={[styles.statusText, { color: statusColor }]}>
          {booking.status.replace("_", " ").toUpperCase()}
        </Text>
        <Text style={[styles.bookingId, { color: colors.mutedForeground }]}>Booking #{booking.id}</Text>
      </View>

      <View style={styles.body}>
        {/* Details */}
        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <DetailRow icon="calendar" label="Scheduled" value={new Date(booking.scheduledAt).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" })} colors={colors} />
          {booking.address && <DetailRow icon="map-pin" label="Address" value={booking.address} colors={colors} />}
          {booking.totalAmount && (
            <DetailRow icon="credit-card" label="Amount" value={`₹${Number(booking.totalAmount).toLocaleString("en-IN")}`} colors={colors} />
          )}
          {booking.notes && <DetailRow icon="file-text" label="Notes" value={booking.notes} colors={colors} />}
        </View>

        {/* Actions */}
        {canCancel && (
          <TouchableOpacity
            style={[styles.cancelBtn, { borderColor: colors.destructive }]}
            onPress={handleCancel}
          >
            <Feather name="x-circle" size={16} color={colors.destructive} />
            <Text style={[styles.cancelText, { color: colors.destructive }]}>Cancel Booking</Text>
          </TouchableOpacity>
        )}

        {liveData && (
  <View style={{ marginTop: 16, marginHorizontal: 16, padding: 16, borderRadius: 12, backgroundColor: "#fff", borderWidth: 1, borderColor: "#e5e7eb" }}>
    <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
      <Text style={{ fontSize: 16, fontWeight: "700" }}>🟢 Live Tracking</Text>
      <Text style={{ fontSize: 11, color: "#666" }}>
        Updated {new Date(liveData.fetchedAt).toLocaleTimeString()}
      </Text>
    </View>

    {/* Distance + ETA */}
    {liveData.customer?.currentLat && liveData.provider?.currentLat && (() => {
      const d = distanceKm(
        { lat: liveData.customer.currentLat!, lng: liveData.customer.currentLng! },
        { lat: liveData.provider.currentLat!, lng: liveData.provider.currentLng! }
      );
      const eta = etaMinutes(d);
      return (
        <View style={{ flexDirection: "row", gap: 12, marginBottom: 12 }}>
          <Stat label="Distance" value={`${d.toFixed(1)} km`} />
          <Stat label="ETA" value={`~${eta} min`} />
          <Stat label="Status" value={liveData.status} />
        </View>
      );
    })()}

    {/* Map with both pins */}
    <LiveTrackingMap
      height={280}
      points={[
        ...(liveData.customer?.currentLat && liveData.customer?.currentLng
          ? [{ lat: liveData.customer.currentLat, lng: liveData.customer.currentLng, label: `Customer: ${liveData.customer.name}`, color: "blue" }]
          : []),
        ...(liveData.provider?.currentLat && liveData.provider?.currentLng
          ? [{ lat: liveData.provider.currentLat, lng: liveData.provider.currentLng, label: `${liveData.provider.role}: ${liveData.provider.name}`, color: "red" }]
          : []),
      ]}
    />

    {(!liveData.customer?.currentLat || !liveData.provider?.currentLat) && (
      <Text style={{ marginTop: 10, fontSize: 12, color: "#666", textAlign: "center" }}>
        Waiting for {!liveData.customer?.currentLat ? "customer" : "provider"} to share location…
      </Text>
    )}
  </View>
)}

        {/* Review */}
        {canReview && !showReview && (
          <TouchableOpacity
            style={[styles.reviewBtn, { backgroundColor: colors.primary }]}
            onPress={() => setShowReview(true)}
          >
            <Feather name="star" size={16} color="#fff" />
            <Text style={styles.reviewBtnText}>Leave a Review</Text>
          </TouchableOpacity>
        )}

        {showReview && (
          <View style={[styles.reviewForm, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={[styles.reviewTitle, { color: colors.foreground }]}>Your Review</Text>
            <View style={styles.starsRow}>
              {[1, 2, 3, 4, 5].map((i) => (
                <TouchableOpacity key={i} onPress={() => setReviewRating(i)}>
                  <Feather
                    name="star"
                    size={32}
                    color={i <= reviewRating ? colors.warning : colors.border}
                  />
                </TouchableOpacity>
              ))}
            </View>
            <TextInput
              style={[styles.commentInput, { color: colors.foreground, borderColor: colors.border, backgroundColor: colors.background }]}
              value={reviewComment}
              onChangeText={setReviewComment}
              placeholder="Share your experience..."
              placeholderTextColor={colors.mutedForeground}
              multiline
              numberOfLines={3}
            />
            <View style={styles.reviewActions}>
              <TouchableOpacity style={[styles.cancelReviewBtn, { borderColor: colors.border }]} onPress={() => setShowReview(false)}>
                <Text style={[{ color: colors.foreground, fontFamily: "Inter_500Medium", fontSize: 14 }]}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.submitBtn, { backgroundColor: colors.primary, opacity: submittingReview ? 0.7 : 1 }]}
                onPress={handleReview}
                disabled={submittingReview}
              >
                <Text style={{ color: "#fff", fontFamily: "Inter_600SemiBold", fontSize: 14 }}>
                  {submittingReview ? "Submitting..." : "Submit Review"}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </View>
    </ScrollView>
  );
}

function DetailRow({ icon, label, value, colors }: { icon: string; label: string; value: string; colors: any }) {
  return (
    <View style={styles.detailRow}>
      <Feather name={icon as any} size={16} color={colors.mutedForeground} />
      <View style={{ flex: 1 }}>
        <Text style={[styles.detailLabel, { color: colors.mutedForeground }]}>{label}</Text>
        <Text style={[styles.detailValue, { color: colors.foreground }]}>{value}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  statusHeader: {
    alignItems: "center",
    paddingVertical: 28,
    gap: 8,
  },
  statusIcon: { width: 64, height: 64, borderRadius: 32, alignItems: "center", justifyContent: "center" },
  statusText: { fontSize: 18, fontFamily: "Inter_700Bold" },
  bookingId: { fontSize: 13, fontFamily: "Inter_400Regular" },
  body: { padding: 16, gap: 12 },
  card: { borderWidth: 1, borderRadius: 14, padding: 14, gap: 12 },
  detailRow: { flexDirection: "row", alignItems: "flex-start", gap: 12 },
  detailLabel: { fontSize: 12, fontFamily: "Inter_400Regular" },
  detailValue: { fontSize: 15, fontFamily: "Inter_500Medium", marginTop: 2 },
  cancelBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    height: 48,
    borderRadius: 12,
    borderWidth: 1.5,
    gap: 8,
  },
  cancelText: { fontSize: 15, fontFamily: "Inter_600SemiBold" },
  reviewBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    height: 48,
    borderRadius: 12,
    gap: 8,
  },
  reviewBtnText: { fontSize: 15, fontFamily: "Inter_600SemiBold", color: "#fff" },
  reviewForm: { borderWidth: 1, borderRadius: 14, padding: 16, gap: 12 },
  reviewTitle: { fontSize: 17, fontFamily: "Inter_700Bold" },
  starsRow: { flexDirection: "row", gap: 8 },
  commentInput: {
    borderWidth: 1,
    borderRadius: 10,
    padding: 12,
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    textAlignVertical: "top",
    minHeight: 80,
  },
  reviewActions: { flexDirection: "row", gap: 10 },
  cancelReviewBtn: { flex: 1, height: 42, borderRadius: 10, borderWidth: 1, alignItems: "center", justifyContent: "center" },
  submitBtn: { flex: 2, height: 42, borderRadius: 10, alignItems: "center", justifyContent: "center" },
});

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <View style={{ flex: 1, padding: 10, backgroundColor: "#f8fafc", borderRadius: 8 }}>
      <Text style={{ fontSize: 11, color: "#64748b" }}>{label}</Text>
      <Text style={{ fontSize: 14, fontWeight: "700", marginTop: 2, textTransform: "capitalize" }}>{value}</Text>
    </View>
  );
}