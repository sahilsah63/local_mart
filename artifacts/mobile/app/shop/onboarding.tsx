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

const SHOP_CATEGORIES = ["mobile", "laptop", "tv", "ac", "general"];

export default function ShopOnboarding() {
  const router = useRouter();
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [existingId, setExistingId] = useState<number | null>(null);

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [address, setAddress] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState(user?.email ?? "");
  const [category, setCategory] = useState("general");
  const [workingHours, setWorkingHours] = useState("10:00 AM - 9:00 PM");
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const me = await api.get<any>("/shops/my");
        if (me?.id) {
          setExistingId(me.id);
          setName(me.name ?? "");
          setDescription(me.description ?? "");
          setAddress(me.address ?? "");
          setPhone(me.phone ?? "");
          setEmail(me.email ?? "");
          setCategory(me.category ?? "general");
          setWorkingHours(me.workingHours ?? "");
          if (me.lat && me.lng) setCoords({ lat: me.lat, lng: me.lng });
        }
      } catch { /* no existing shop */ }
      finally { setLoading(false); }
    })();
  }, []);

  const captureLocation = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") return Alert.alert("Permission denied", "Location is required.");
      const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
      setCoords({ lat: loc.coords.latitude, lng: loc.coords.longitude });
    } catch (e: any) {
      Alert.alert("Could not get location", e?.message ?? "Try again");
    }
  };

  const onSubmit = async () => {
    if (!name.trim()) return Alert.alert("Required", "Shop name is required.");
    if (!address.trim()) return Alert.alert("Required", "Shop address is required.");
    if (!coords) return Alert.alert("Set location", "Please capture your shop location.");

    const payload = {
      ownerId: user?.id,
      name: name.trim(),
      description: description.trim() || null,
      address: address.trim(),
      phone: phone.trim() || null,
      email: email.trim() || null,
      category,
      workingHours: workingHours.trim() || null,
      images: [],
      lat: coords.lat,
      lng: coords.lng,
    };

    setSaving(true);
    try {
      if (existingId) {
        await api.put(`/shops/${existingId}`, payload);
        Alert.alert("✅ Updated", "Shop details saved.", [
          { text: "OK", onPress: () => router.replace("/(tabs)") },
        ]);
      } else {
        await api.post(`/shops`, payload);
        Alert.alert("✅ Created", "Your shop is now live! Add products next.", [
          { text: "Add Products", onPress: () => router.replace("/shop/products") },
        ]);
      }
    } catch (e: any) {
      Alert.alert("Save failed", e?.message ?? "Unknown error");
    } finally { setSaving(false); }
  };

  if (loading) return <View style={{ flex: 1, justifyContent: "center" }}><ActivityIndicator /></View>;

  const topPad = Platform.OS === "web" ? 16 : insets.top + 16;

  return (
    <ScrollView style={{ flex: 1, backgroundColor: colors.background }} contentContainerStyle={{ padding: 16, paddingTop: topPad }}>
      <Text style={[styles.title, { color: colors.foreground }]}>
        {existingId ? "Edit Shop Details" : "Register Your Shop"}
      </Text>
      <Text style={{ color: colors.mutedForeground, marginBottom: 16 }}>
        Customers nearby will discover your shop.
      </Text>

      <Field label="Shop name *" colors={colors}>
        <TextInput value={name} onChangeText={setName} placeholder="e.g. Hazratganj Electronics"
          placeholderTextColor={colors.mutedForeground}
          style={[styles.input, { color: colors.foreground, borderColor: colors.border }]} />
      </Field>

      <Field label="Description" colors={colors}>
        <TextInput value={description} onChangeText={setDescription} multiline
          placeholder="What do you sell? Repairs offered?"
          placeholderTextColor={colors.mutedForeground}
          style={[styles.input, { color: colors.foreground, borderColor: colors.border, minHeight: 70, textAlignVertical: "top" }]} />
      </Field>

      <Field label="Category" colors={colors}>
        <View style={styles.chipWrap}>
          {SHOP_CATEGORIES.map((c) => {
            const active = category === c;
            return (
              <TouchableOpacity key={c} onPress={() => setCategory(c)}
                style={[styles.chip, {
                  backgroundColor: active ? colors.primary : colors.card,
                  borderColor: active ? colors.primary : colors.border,
                }]}>
                <Text style={{ color: active ? "#fff" : colors.foreground, fontSize: 13, textTransform: "capitalize" }}>{c}</Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </Field>

      <Field label="Address *" colors={colors}>
        <TextInput value={address} onChangeText={setAddress}
          placeholder="Street, Area, City" placeholderTextColor={colors.mutedForeground}
          style={[styles.input, { color: colors.foreground, borderColor: colors.border }]} />
      </Field>

      <View style={{ flexDirection: "row", gap: 12 }}>
        <View style={{ flex: 1 }}>
          <Field label="Phone" colors={colors}>
            <TextInput value={phone} onChangeText={setPhone} keyboardType="phone-pad"
              placeholder="+91…" placeholderTextColor={colors.mutedForeground}
              style={[styles.input, { color: colors.foreground, borderColor: colors.border }]} />
          </Field>
        </View>
        <View style={{ flex: 1 }}>
          <Field label="Email" colors={colors}>
            <TextInput value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none"
              placeholderTextColor={colors.mutedForeground}
              style={[styles.input, { color: colors.foreground, borderColor: colors.border }]} />
          </Field>
        </View>
      </View>

      <Field label="Working hours" colors={colors}>
        <TextInput value={workingHours} onChangeText={setWorkingHours}
          placeholder="e.g. 10 AM - 9 PM" placeholderTextColor={colors.mutedForeground}
          style={[styles.input, { color: colors.foreground, borderColor: colors.border }]} />
      </Field>

      <Field label="Shop location *" colors={colors}>
        <TouchableOpacity onPress={captureLocation}
          style={[styles.locBtn, { borderColor: colors.border, backgroundColor: colors.card }]}>
          <Feather name="map-pin" size={18} color={colors.primary} />
          <Text style={{ marginLeft: 8, color: colors.foreground, flex: 1 }}>
            {coords ? `${coords.lat.toFixed(4)}, ${coords.lng.toFixed(4)}` : "Tap to capture shop location"}
          </Text>
          {coords && (
            <View style={{ backgroundColor: "#22c55e22", paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 }}>
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
                const url = `https://www.openstreetmap.org/?mlat=${coords.lat}&mlon=${coords.lng}#map=17/${coords.lat}/${coords.lng}`;
                if (Platform.OS === "web") window.open(url, "_blank");
              }}
            >OpenStreetMap</Text>
          </Text>
        )}
      </Field>

      <TouchableOpacity disabled={saving} onPress={onSubmit}
        style={[styles.submitBtn, { backgroundColor: colors.primary, opacity: saving ? 0.6 : 1 }]}>
        {saving ? <ActivityIndicator color="#fff" /> :
          <Text style={{ color: "#fff", fontWeight: "700", fontSize: 16 }}>
            {existingId ? "Save Changes" : "Register Shop"}
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
  submitBtn: { padding: 16, borderRadius: 12, alignItems: "center", marginBottom: 40 },
});