import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Platform,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { ImageUploader } from "@/components/ImageUploader";

import { useColors } from "@/hooks/useColors";
import { api } from "@/lib/api";

const CATEGORIES = ["mobile", "laptop", "tv", "ac", "accessory", "general"];

export default function ProductForm() {
  const router = useRouter();
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{
    shopId?: string;
    productId?: string;
  }>();
  const shopId = Number(params.shopId);
  const productId = params.productId ? Number(params.productId) : null;
  const isEdit = !!productId;

  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [stock, setStock] = useState("0");
  const [category, setCategory] = useState("general");
  const [isActive, setIsActive] = useState(true);
  const [images, setImages] = useState<string[]>([]);

  useEffect(() => {
    if (!isEdit) return;
    (async () => {
      try {
        const p = await api.get<any>(`/products/${productId}`);
        setName(p.name ?? "");
        setDescription(p.description ?? "");
        setPrice(String(p.price ?? ""));
        setStock(String(p.stock ?? 0));
        setCategory(p.category ?? "general");
        setIsActive(!!p.isActive);

        setImages(p.images ?? []);
      } catch (e: any) {
        Alert.alert("Load failed", e?.message ?? "Try again");
      } finally {
        setLoading(false);
      }
    })();
  }, [isEdit, productId]);

  const onSubmit = async () => {
    if (!name.trim())
      return Alert.alert("Required", "Product name is required.");
    if (!price.trim() || isNaN(Number(price)))
      return Alert.alert("Required", "Valid price is required.");

    const payload = {
      shopId,
      name: name.trim(),
      description: description.trim() || null,
      price: parseFloat(price),
      stock: parseInt(stock) || 0,
      category,
      // images: [],
      images,
      isActive,
    };

    setSaving(true);
    try {
      if (isEdit) await api.put(`/products/${productId}`, payload);
      else await api.post(`/products`, payload);
      router.back();
    } catch (e: any) {
      Alert.alert("Save failed", e?.message ?? "Try again");
    } finally {
      setSaving(false);
    }
  };

  if (loading)
    return (
      <View style={{ flex: 1, justifyContent: "center" }}>
        <ActivityIndicator />
      </View>
    );

  const topPad = Platform.OS === "web" ? 16 : insets.top + 16;

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.background }}
      contentContainerStyle={{ padding: 16, paddingTop: topPad }}
    >
      <Text
        style={{
          fontSize: 22,
          fontWeight: "700",
          color: colors.foreground,
          marginBottom: 16,
        }}
      >
        {isEdit ? "Edit Product" : "Add Product"}
      </Text>

      <Field label="Product name *" colors={colors}>
        <TextInput
          value={name}
          onChangeText={setName}
          placeholder="e.g. Type-C Charger 25W"
          placeholderTextColor={colors.mutedForeground}
          style={[
            styles.input,
            { color: colors.foreground, borderColor: colors.border },
          ]}
        />
      </Field>

      <Field label="Description" colors={colors}>
        <TextInput
          value={description}
          onChangeText={setDescription}
          multiline
          placeholder="Brief details, warranty, etc."
          placeholderTextColor={colors.mutedForeground}
          style={[
            styles.input,
            {
              color: colors.foreground,
              borderColor: colors.border,
              minHeight: 70,
              textAlignVertical: "top",
            },
          ]}
        />
      </Field>

      <ImageUploader
        value={images}
        onChange={setImages}
        folder="products"
        max={5}
        label="Product Photos"
      />

      <View style={{ flexDirection: "row", gap: 12 }}>
        <View style={{ flex: 1 }}>
          <Field label="Price (₹) *" colors={colors}>
            <TextInput
              value={price}
              onChangeText={setPrice}
              keyboardType="numeric"
              placeholder="0"
              placeholderTextColor={colors.mutedForeground}
              style={[
                styles.input,
                { color: colors.foreground, borderColor: colors.border },
              ]}
            />
          </Field>
        </View>
        <View style={{ flex: 1 }}>
          <Field label="Stock" colors={colors}>
            <TextInput
              value={stock}
              onChangeText={setStock}
              keyboardType="numeric"
              style={[
                styles.input,
                { color: colors.foreground, borderColor: colors.border },
              ]}
            />
          </Field>
        </View>
      </View>

      <Field label="Category" colors={colors}>
        <View style={styles.chipWrap}>
          {CATEGORIES.map((c) => {
            const active = category === c;
            return (
              <TouchableOpacity
                key={c}
                onPress={() => setCategory(c)}
                style={[
                  styles.chip,
                  {
                    backgroundColor: active ? colors.primary : colors.card,
                    borderColor: active ? colors.primary : colors.border,
                  },
                ]}
              >
                <Text
                  style={{
                    color: active ? "#fff" : colors.foreground,
                    fontSize: 13,
                    textTransform: "capitalize",
                  }}
                >
                  {c}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </Field>

      <View
        style={[
          styles.row,
          { borderColor: colors.border, backgroundColor: colors.card },
        ]}
      >
        <View style={{ flex: 1 }}>
          <Text style={{ fontWeight: "600", color: colors.foreground }}>
            Active (visible to customers)
          </Text>
          <Text style={{ fontSize: 12, color: colors.mutedForeground }}>
            Turn off to hide without deleting
          </Text>
        </View>
        <Switch value={isActive} onValueChange={setIsActive} />
      </View>

      <TouchableOpacity
        disabled={saving}
        onPress={onSubmit}
        style={[
          styles.submitBtn,
          { backgroundColor: colors.primary, opacity: saving ? 0.6 : 1 },
        ]}
      >
        {saving ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={{ color: "#fff", fontWeight: "700", fontSize: 16 }}>
            {isEdit ? "Save Changes" : "Add Product"}
          </Text>
        )}
      </TouchableOpacity>
    </ScrollView>
  );
}

function Field({ label, children, colors }: any) {
  return (
    <View style={{ marginBottom: 16 }}>
      <Text
        style={{
          fontSize: 13,
          fontWeight: "600",
          color: colors.foreground,
          marginBottom: 6,
        }}
      >
        {label}
      </Text>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  input: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
  },
  chipWrap: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 18,
    borderWidth: 1,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderRadius: 10,
    padding: 12,
    marginBottom: 20,
  },
  submitBtn: {
    padding: 16,
    borderRadius: 12,
    alignItems: "center",
    marginBottom: 40,
  },
});
