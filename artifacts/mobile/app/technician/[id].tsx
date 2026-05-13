import { Feather } from "@expo/vector-icons";
import {
  useGetTechnician,
  useListServices,
  useListReviews,
  useCreateBooking,
} from "@workspace/api-client-react";
import { useLocalSearchParams, useRouter } from "expo-router";
import * as Haptics from "expo-haptics";
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

import { RatingStars } from "@/components/RatingStars";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import { EmptyState } from "@/components/EmptyState";
import { useAuth } from "@/context/AuthContext";
import { useColors } from "@/hooks/useColors";

export default function TechnicianDetailScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user } = useAuth();
  const technicianId = Number(id);

  const { data: tech, isLoading } = useGetTechnician(technicianId);
  const { data: servicesData } = useListServices({ query: { params: { technicianId } } });
  const { data: reviewsData } = useListReviews({ query: { params: { technicianId, limit: 10 } } });
  const { mutate: createBooking, isPending: booking } = useCreateBooking({
    mutation: {
      onSuccess: () => {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        Alert.alert("Booking Sent", "Your booking request has been sent!", [
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
    tomorrow.setHours(10, 0, 0, 0);
    createBooking({
      data: {
        technicianId,
        scheduledAt: tomorrow.toISOString(),
        address: user.address ?? "Please provide your address",
        notes: "Repair service requested",
      },
    });
  };

  if (isLoading) return <LoadingSpinner />;
  if (!tech) return <EmptyState icon="user" title="Technician not found" />;

  const services = servicesData ?? [];
  const reviews = reviewsData?.reviews ?? [];

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={{ paddingBottom: Platform.OS === "web" ? 34 : insets.bottom + 32 }}
      showsVerticalScrollIndicator={false}
    >
      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.primary }]}>
        <View style={[styles.avatar, { backgroundColor: "rgba(255,255,255,0.2)" }]}>
          <Text style={styles.avatarText}>{tech.name.charAt(0).toUpperCase()}</Text>
        </View>
        <View style={styles.headerInfo}>
          <View style={styles.nameRow}>
            <Text style={styles.techName}>{tech.name}</Text>
            {tech.isVerified && (
              <Feather name="check-circle" size={16} color="rgba(255,255,255,0.9)" style={{ marginLeft: 6 }} />
            )}
          </View>
          <RatingStars rating={tech.rating} count={tech.ratingCount} size={14} />
          <View
            style={[
              styles.availBadge,
              { backgroundColor: tech.isAvailable ? "rgba(16,185,129,0.25)" : "rgba(255,255,255,0.1)" },
            ]}
          >
            <View style={[styles.availDot, { backgroundColor: tech.isAvailable ? "#10b981" : "#ccc" }]} />
            <Text style={styles.availText}>
              {tech.isAvailable ? "Available Now" : "Unavailable"}
            </Text>
          </View>
        </View>
      </View>

      <View style={styles.body}>
        {/* Stats */}
        <View style={styles.statsRow}>
          <View style={[styles.statCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={[styles.statValue, { color: colors.primary }]}>₹{tech.hourlyRate}</Text>
            <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>Per Hour</Text>
          </View>
          <View style={[styles.statCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={[styles.statValue, { color: colors.primary }]}>{tech.experienceYears}yr</Text>
            <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>Experience</Text>
          </View>
          <View style={[styles.statCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={[styles.statValue, { color: colors.primary }]}>{tech.serviceRadius}km</Text>
            <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>Radius</Text>
          </View>
        </View>

        {/* Bio */}
        {tech.bio && (
          <View style={[styles.bioBox, { backgroundColor: colors.muted, borderRadius: 12 }]}>
            <Text style={[styles.bioText, { color: colors.foreground }]}>{tech.bio}</Text>
          </View>
        )}

        {/* Skills */}
        <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Skills</Text>
        <View style={styles.skillsWrap}>
          {tech.skills.map((s) => (
            <View key={s} style={[styles.skillTag, { backgroundColor: colors.secondary }]}>
              <Text style={[styles.skillText, { color: colors.primary }]}>{s}</Text>
            </View>
          ))}
        </View>

        {/* Book Button */}
        <TouchableOpacity
          style={[styles.bookBtn, { backgroundColor: colors.primary, opacity: booking ? 0.7 : 1 }]}
          onPress={handleBook}
          disabled={booking}
        >
          <Feather name="calendar" size={18} color="#fff" />
          <Text style={styles.bookBtnText}>{booking ? "Booking..." : "Book This Technician"}</Text>
        </TouchableOpacity>

        {/* Services */}
        {services.length > 0 && (
          <>
            <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Services Offered</Text>
            {services.map((svc) => (
              <View key={svc.id} style={[styles.serviceCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <View style={styles.serviceHeader}>
                  <Text style={[styles.serviceName, { color: colors.foreground }]}>{svc.name}</Text>
                  <Text style={[styles.servicePrice, { color: colors.primary }]}>₹{svc.price}</Text>
                </View>
                {svc.description && (
                  <Text style={[styles.serviceDesc, { color: colors.mutedForeground }]}>{svc.description}</Text>
                )}
                {svc.durationMinutes && (
                  <View style={styles.durationRow}>
                    <Feather name="clock" size={13} color={colors.mutedForeground} />
                    <Text style={[styles.durationText, { color: colors.mutedForeground }]}>
                      {" "}{svc.durationMinutes} min
                    </Text>
                  </View>
                )}
              </View>
            ))}
          </>
        )}

        {/* Reviews */}
        <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Reviews</Text>
        {reviews.length === 0 ? (
          <Text style={[styles.noReviews, { color: colors.mutedForeground }]}>No reviews yet.</Text>
        ) : (
          reviews.map((rev) => (
            <View key={rev.id} style={[styles.reviewCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <View style={styles.reviewHeader}>
                <Text style={[styles.reviewName, { color: colors.foreground }]}>{rev.userName ?? "User"}</Text>
                <RatingStars rating={rev.rating} size={12} />
              </View>
              {rev.comment && (
                <Text style={[styles.reviewComment, { color: colors.mutedForeground }]}>{rev.comment}</Text>
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
  header: {
    flexDirection: "row",
    padding: 20,
    paddingTop: 24,
    gap: 16,
    alignItems: "center",
  },
  avatar: { width: 72, height: 72, borderRadius: 36, alignItems: "center", justifyContent: "center" },
  avatarText: { fontSize: 32, fontFamily: "Inter_700Bold", color: "#fff" },
  headerInfo: { flex: 1, gap: 6 },
  nameRow: { flexDirection: "row", alignItems: "center" },
  techName: { fontSize: 22, fontFamily: "Inter_700Bold", color: "#fff" },
  availBadge: { flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10, alignSelf: "flex-start" },
  availDot: { width: 8, height: 8, borderRadius: 4 },
  availText: { fontSize: 12, fontFamily: "Inter_500Medium", color: "#fff" },
  body: { padding: 16, gap: 12 },
  statsRow: { flexDirection: "row", gap: 10 },
  statCard: { flex: 1, borderWidth: 1, borderRadius: 12, padding: 12, alignItems: "center", gap: 2 },
  statValue: { fontSize: 18, fontFamily: "Inter_700Bold" },
  statLabel: { fontSize: 12, fontFamily: "Inter_400Regular" },
  bioBox: { padding: 14 },
  bioText: { fontSize: 14, fontFamily: "Inter_400Regular", lineHeight: 22 },
  sectionTitle: { fontSize: 18, fontFamily: "Inter_700Bold", marginTop: 4 },
  skillsWrap: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  skillTag: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20 },
  skillText: { fontSize: 13, fontFamily: "Inter_500Medium" },
  bookBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", height: 52, borderRadius: 14, gap: 8 },
  bookBtnText: { fontSize: 16, fontFamily: "Inter_600SemiBold", color: "#fff" },
  serviceCard: { borderWidth: 1, borderRadius: 12, padding: 12, gap: 6 },
  serviceHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  serviceName: { fontSize: 15, fontFamily: "Inter_600SemiBold", flex: 1 },
  servicePrice: { fontSize: 16, fontFamily: "Inter_700Bold" },
  serviceDesc: { fontSize: 13, fontFamily: "Inter_400Regular", lineHeight: 18 },
  durationRow: { flexDirection: "row", alignItems: "center" },
  durationText: { fontSize: 12, fontFamily: "Inter_400Regular" },
  noReviews: { fontSize: 14, fontFamily: "Inter_400Regular", fontStyle: "italic" },
  reviewCard: { borderWidth: 1, borderRadius: 12, padding: 12, gap: 6 },
  reviewHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  reviewName: { fontSize: 14, fontFamily: "Inter_600SemiBold" },
  reviewComment: { fontSize: 13, fontFamily: "Inter_400Regular", lineHeight: 20 },
});
