import { Feather } from "@expo/vector-icons";
import { useRegister } from "@workspace/api-client-react";
import { useRouter } from "expo-router";
import * as Haptics from "expo-haptics";
import React, { useState } from "react";
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useAuth } from "@/context/AuthContext";
import { useColors } from "@/hooks/useColors";

type Role = "user" | "technician" | "shop_owner";

const ROLES: { key: Role; label: string; icon: string; desc: string }[] = [
  { key: "user", label: "Customer", icon: "user", desc: "Book repair services" },
  { key: "technician", label: "Technician", icon: "tool", desc: "Offer repair services" },
  { key: "shop_owner", label: "Shop Owner", icon: "shopping-bag", desc: "List your shop" },
];

export default function RegisterScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { signIn } = useAuth();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<Role>("user");
  const [showPassword, setShowPassword] = useState(false);

  const { mutate: register, isPending } = useRegister({
    mutation: {
      onSuccess: async (data) => {
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        await signIn(data.token, data.user);
        router.dismiss();
      },
      onError: (err: any) => {
        Alert.alert("Registration Failed", err?.data?.message ?? "Could not create account. Try again.");
      },
    },
  });

  const handleRegister = () => {
    if (!name.trim() || !email.trim() || !password) {
      Alert.alert("Required", "Please fill in all required fields");
      return;
    }
    register({ data: { name: name.trim(), email: email.trim().toLowerCase(), phone: phone || undefined, password, role } });
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <ScrollView
        style={[styles.container, { backgroundColor: colors.background }]}
        contentContainerStyle={{ paddingBottom: insets.bottom + 32 }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <TouchableOpacity style={[styles.closeBtn, { top: insets.top + 16 }]} onPress={() => router.dismiss()}>
          <Feather name="x" size={22} color={colors.foreground} />
        </TouchableOpacity>

        <View style={[styles.hero, { paddingTop: insets.top + 72 }]}>
          <View style={[styles.logoWrap, { backgroundColor: colors.primary }]}>
            <Feather name="zap" size={32} color="#fff" />
          </View>
          <Text style={[styles.title, { color: colors.foreground }]}>Create Account</Text>
          <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>Join TechniConnect</Text>
        </View>

        <View style={styles.form}>
          {/* Role Picker */}
          <Text style={[styles.label, { color: colors.foreground }]}>I am a...</Text>
          <View style={styles.roleRow}>
            {ROLES.map((r) => (
              <TouchableOpacity
                key={r.key}
                style={[
                  styles.roleCard,
                  {
                    backgroundColor: role === r.key ? colors.primary + "15" : colors.card,
                    borderColor: role === r.key ? colors.primary : colors.border,
                  },
                ]}
                onPress={() => setRole(r.key)}
              >
                <Feather name={r.icon as any} size={22} color={role === r.key ? colors.primary : colors.mutedForeground} />
                <Text style={[styles.roleLabel, { color: role === r.key ? colors.primary : colors.foreground }]}>{r.label}</Text>
                <Text style={[styles.roleDesc, { color: colors.mutedForeground }]}>{r.desc}</Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Inputs */}
          <View style={[styles.inputWrap, { borderColor: colors.border, backgroundColor: colors.card }]}>
            <Feather name="user" size={18} color={colors.mutedForeground} />
            <TextInput style={[styles.input, { color: colors.foreground }]} value={name} onChangeText={setName} placeholder="Full name" placeholderTextColor={colors.mutedForeground} />
          </View>
          <View style={[styles.inputWrap, { borderColor: colors.border, backgroundColor: colors.card }]}>
            <Feather name="mail" size={18} color={colors.mutedForeground} />
            <TextInput style={[styles.input, { color: colors.foreground }]} value={email} onChangeText={setEmail} placeholder="Email address" placeholderTextColor={colors.mutedForeground} keyboardType="email-address" autoCapitalize="none" autoCorrect={false} />
          </View>
          <View style={[styles.inputWrap, { borderColor: colors.border, backgroundColor: colors.card }]}>
            <Feather name="phone" size={18} color={colors.mutedForeground} />
            <TextInput style={[styles.input, { color: colors.foreground }]} value={phone} onChangeText={setPhone} placeholder="Phone number (optional)" placeholderTextColor={colors.mutedForeground} keyboardType="phone-pad" />
          </View>
          <View style={[styles.inputWrap, { borderColor: colors.border, backgroundColor: colors.card }]}>
            <Feather name="lock" size={18} color={colors.mutedForeground} />
            <TextInput style={[styles.input, { color: colors.foreground }]} value={password} onChangeText={setPassword} placeholder="Password" placeholderTextColor={colors.mutedForeground} secureTextEntry={!showPassword} />
            <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
              <Feather name={showPassword ? "eye-off" : "eye"} size={18} color={colors.mutedForeground} />
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            style={[styles.btn, { backgroundColor: colors.primary, opacity: isPending ? 0.7 : 1 }]}
            onPress={handleRegister}
            disabled={isPending}
          >
            <Text style={styles.btnText}>{isPending ? "Creating..." : "Create Account"}</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.loginLink} onPress={() => router.replace("/auth/login")}>
            <Text style={[styles.loginLinkText, { color: colors.mutedForeground }]}>
              Already have an account?{" "}
              <Text style={{ color: colors.primary, fontFamily: "Inter_600SemiBold" }}>Sign In</Text>
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  closeBtn: { position: "absolute", right: 16, zIndex: 10, padding: 4 },
  hero: { alignItems: "center", paddingHorizontal: 32, paddingBottom: 28, gap: 8 },
  logoWrap: { width: 72, height: 72, borderRadius: 20, alignItems: "center", justifyContent: "center", marginBottom: 12 },
  title: { fontSize: 28, fontFamily: "Inter_700Bold" },
  subtitle: { fontSize: 15, fontFamily: "Inter_400Regular" },
  form: { paddingHorizontal: 24, gap: 12 },
  label: { fontSize: 15, fontFamily: "Inter_600SemiBold", marginBottom: 4 },
  roleRow: { flexDirection: "row", gap: 8, marginBottom: 4 },
  roleCard: { flex: 1, borderWidth: 1.5, borderRadius: 12, padding: 12, alignItems: "center", gap: 4 },
  roleLabel: { fontSize: 13, fontFamily: "Inter_600SemiBold" },
  roleDesc: { fontSize: 10, fontFamily: "Inter_400Regular", textAlign: "center" },
  inputWrap: { flexDirection: "row", alignItems: "center", borderWidth: 1, borderRadius: 12, paddingHorizontal: 14, height: 52, gap: 10 },
  input: { flex: 1, fontSize: 15, fontFamily: "Inter_400Regular", paddingVertical: 0 },
  btn: { height: 52, borderRadius: 12, alignItems: "center", justifyContent: "center", marginTop: 4 },
  btnText: { fontSize: 16, fontFamily: "Inter_600SemiBold", color: "#fff" },
  loginLink: { alignItems: "center", paddingVertical: 8 },
  loginLinkText: { fontSize: 14, fontFamily: "Inter_400Regular" },
});
