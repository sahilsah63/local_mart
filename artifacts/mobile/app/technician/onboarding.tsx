import { Feather } from "@expo/vector-icons";
import * as Location from "expo-location";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator, Alert, Platform, ScrollView, StyleSheet,
  Text, TextInput, TouchableOpacity, View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useAuth } from "@/context/AuthContext";
import { useColors } from "@/hooks/useColors";
import { api } from "@/lib/api";

const SKILL_OPTIONS = [
  "mobile", "laptop", "desktop", "tablet",
  "tv", "ac", "refrigerator", "washing-machine",
  "microwave", "printer", "camera", "audio",
];

export default function TechnicianOnboarding() {
  const router = useRouter();
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [existingId, setExistingId] = useState<number | null>(null);

  const [bio, setBio] = useState("");
  const [phone, setPhone] = useState("");
  const [skills, setSkills] = useState<string[]>([]);
  const [experienceYears, setExperienceYears] = useState("0");
  const [hourlyRate, setHourlyRate] = useState("300");
  const [serviceRadius, setServiceRadius] = useState("25");
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [isAvailable, setIsAvailable] = useState(true);

  // Load existing profile if any
  useEffect(() => {
    (async () => {
      try {
        const me = await api.get<any>("/technicians/my");
        if (me?.id) {
          setExistingId(me.id);
          setBio(me.bio ?? "");
          setPhone(me.phone ?? "");
          setSkills(me.skills ?? []);
          setExperienceYears(String(me.experienceYears ?? 0));
          setHourlyRate(String(me.hourlyRate ?? 300));
          setServiceRadius(String(me.serviceRadius ?? 25));
          if (me.lat && me.lng) setCoords({ lat: me.lat, lng: me.lng });
          setIsAvailable(!!me.isAvailable);
        }
      } catch {
        // no existing profile, that's fine
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const toggleSkill = (skill: string) => {
    setSkills((prev) => prev.includes(skill) ? prev.filter((s) => s !== skill) : [...prev, skill]);
  };

  const captureLocation = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        Alert.alert("Permission denied", "Location is required to set your service area.");
        return;
      }
      const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
      setCoords({ lat: loc.coords.latitude, lng: loc.coords.longitude });
    } catch (e: any) {
      Alert.alert("Could not get location", e?.message ?? "Try again");
    }
  };

  const onSubmit = async () => {
    if (skills.length === 0) return Alert.alert("Add skills", "Please select at least one skill.");
    if (!coords) return Alert.alert("Set location", "Please capture your current location.");
    if (!bio.trim()) return Alert.alert("Add bio", "Tell customers about your experience.");

    const payload = {
      userId: user?.id,
      name: user?.name,
      email: user?.email,
      bio: bio.trim(),
      phone: phone.trim(),
      skills,
      experienceYears: parseInt(experienceYears) || 0,
      hourlyRate: parseFloat(hourlyRate) || 0,
      serviceRadius: parseInt(serviceRadius) || 25,
      lat: coords.lat,
      lng: coords.lng,
      isAvailable,
    };

    setSaving(true);
    try {
      if (existingId) {
        await api.put(`/technicians/${existingId}`, payload);
      } else {
        await api.post(`/technicians`, payload);
      }
      Alert.alert("✅ Saved", "Your profile is live!", [
        { text: "OK", onPress: () => router.replace("/(tabs)") },
      ]);
    } catch (e: any) {
      Alert.alert("Save failed", e?.message ?? "Unknown error");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <View style={{ flex: 1, justifyContent: "center" }}><ActivityIndicator /></View>;

  const topPad = Platform.OS === "web" ? 16 : insets.top + 16;

  return (
    <ScrollView style={{ flex: 1, backgroundColor: colors.background }} contentContainerStyle={{ padding: 16, paddingTop: topPad }}>
      <Text style={[styles.title, { color: colors.foreground }]}>
        {existingId ? "Edit Your Profile" : "Set Up Your Profile"}
      </Text>
      <Text style={{ color: colors.mutedForeground, marginBottom: 16 }}>
        Customers will see this information when booking.
      </Text>

      <Field label="Bio" colors={colors}>
        <TextInput
          value={bio} onChangeText={setBio} multiline numberOfLines={3}
          placeholder="e.g. 5+ years repairing mobiles and laptops..."
          placeholderTextColor={colors.mutedForeground}
          style={[styles.input, { color: colors.foreground, borderColor: colors.border, minHeight: 80, textAlignVertical: "top" }]}
        />
      </Field>

      <Field label="Contact phone" colors={colors}>
        <TextInput
          value={phone} onChangeText={setPhone} keyboardType="phone-pad"
          placeholder="+91…" placeholderTextColor={colors.mutedForeground}
          style={[styles.input, { color: colors.foreground, borderColor: colors.border }]}
        />
      </Field>

      <Field label="Skills (tap to select)" colors={colors}>
        <View style={styles.chipWrap}>
          {SKILL_OPTIONS.map((s) => {
            const active = skills.includes(s);
            return (
              <TouchableOpacity key={s} onPress={() => toggleSkill(s)}
                style={[styles.chip, {
                  backgroundColor: active ? colors.primary : colors.card,
                  borderColor: active ? colors.primary : colors.border,
                }]}>
                <Text style={{ color: active ? "#fff" : colors.foreground, fontSize: 13, textTransform: "capitalize" }}>{s}</Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </Field>

      <View style={{ flexDirection: "row", gap: 12 }}>
        <View style={{ flex: 1 }}>
          <Field label="Experience (years)" colors={colors}>
            <TextInput value={experienceYears} onChangeText={setExperienceYears} keyboardType="numeric"
              style={[styles.input, { color: colors.foreground, borderColor: colors.border }]} />
          </Field>
        </View>
        <View style={{ flex: 1 }}>
          <Field label="Hourly rate (₹)" colors={colors}>
            <TextInput value={hourlyRate} onChangeText={setHourlyRate} keyboardType="numeric"
              style={[styles.input, { color: colors.foreground, borderColor: colors.border }]} />
          </Field>
        </View>
      </View>

      <Field label="Service radius (km)" colors={colors}>
        <TextInput value={serviceRadius} onChangeText={setServiceRadius} keyboardType="numeric"
          style={[styles.input, { color: colors.foreground, borderColor: colors.border }]} />
      </Field>

      <Field label="Your location" colors={colors}>
        <TouchableOpacity onPress={captureLocation} style={[styles.locBtn, { borderColor: colors.border, backgroundColor: colors.card }]}>
          <Feather name="map-pin" size={18} color={colors.primary} />
          <Text style={{ marginLeft: 8, color: colors.foreground, flex: 1 }}>
            {coords ? `${coords.lat.toFixed(4)}, ${coords.lng.toFixed(4)}` : "Tap to capture current location"}
          </Text>
          {coords && (
            <View style={{
              backgroundColor: "#22c55e22", paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6,
            }}>
              <Text style={{ color: "#16a34a", fontSize: 11, fontWeight: "600" }}>Captured</Text>
            </View>
          )}
        </TouchableOpacity>
        {coords && (
          <Text style={{ fontSize: 11, color: colors.mutedForeground, marginTop: 6 }}>
            View on{" "}
            <Text
              style={{ color: colors.primary, textDecorationLine: "underline" }}
              onPress={() => {
                const url = `https://www.openstreetmap.org/?mlat=${coords.lat}&mlon=${coords.lng}#map=15/${coords.lat}/${coords.lng}`;
                if (Platform.OS === "web") window.open(url, "_blank");
              }}
            >OpenStreetMap</Text>
          </Text>
        )}
      </Field>

      <TouchableOpacity
        onPress={() => setIsAvailable((v) => !v)}
        style={[styles.toggleRow, { borderColor: colors.border, backgroundColor: colors.card }]}
      >
        <View style={{ flex: 1 }}>
          <Text style={{ color: colors.foreground, fontWeight: "600" }}>Available for bookings</Text>
          <Text style={{ color: colors.mutedForeground, fontSize: 12 }}>Turn off if you're busy</Text>
        </View>
        <View style={{
          width: 44, height: 26, borderRadius: 13, padding: 2,
          backgroundColor: isAvailable ? colors.primary : colors.border,
          justifyContent: "center", alignItems: isAvailable ? "flex-end" : "flex-start",
        }}>
          <View style={{ width: 22, height: 22, borderRadius: 11, backgroundColor: "#fff" }} />
        </View>
      </TouchableOpacity>

      <TouchableOpacity disabled={saving} onPress={onSubmit}
        style={[styles.submitBtn, { backgroundColor: colors.primary, opacity: saving ? 0.6 : 1 }]}>
        {saving ? <ActivityIndicator color="#fff" /> :
          <Text style={{ color: "#fff", fontWeight: "700", fontSize: 16 }}>
            {existingId ? "Save Changes" : "Submit Profile"}
          </Text>}
      </TouchableOpacity>
    </ScrollView>
  );
}

function Field({ label, children, colors }: any) {
  return (
    <View style={{ marginBottom: 16 }}>
      <Text style={{ fontSize: 13, fontWeight: "600", color: colors.foreground, marginBottom: 6 }}>{label}</Text>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  title: { fontSize: 24, fontWeight: "700", marginBottom: 4 },
  input: { borderWidth: 1, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10, fontSize: 14 },
  chipWrap: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  chip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 18, borderWidth: 1 },
  locBtn: { flexDirection: "row", alignItems: "center", borderWidth: 1, borderRadius: 10, padding: 12 },
  toggleRow: { flexDirection: "row", alignItems: "center", borderWidth: 1, borderRadius: 10, padding: 12, marginBottom: 20 },
  submitBtn: { padding: 16, borderRadius: 12, alignItems: "center", marginBottom: 40 },
});