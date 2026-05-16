import { Feather } from "@expo/vector-icons";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

import { cldUrl, pickAndUploadImages } from "@/lib/cloudinary";
import { useColors } from "@/hooks/useColors";

interface Props {
  value: string[];
  onChange: (urls: string[]) => void;
  folder: "products" | "shops" | "users" | "bookings" | "reviews";
  max?: number;
  label?: string;
}

export function ImageUploader({ value, onChange, folder, max = 5, label = "Photos" }: Props) {
  const colors = useColors();
  const [uploading, setUploading] = useState(false);

  const remaining = max - value.length;

  const addImages = async () => {
    if (remaining <= 0) {
      Alert.alert("Max reached", `You can upload up to ${max} images.`);
      return;
    }
    setUploading(true);
    try {
      const uploaded = await pickAndUploadImages({
        folder,
        multiple: max > 1,
        maxImages: remaining,
      });
      if (uploaded.length) {
        onChange([...value, ...uploaded.map((u) => u.url)]);
      }
    } catch (e: any) {
      Alert.alert("Upload failed", e?.message ?? "Try again");
    } finally {
      setUploading(false);
    }
  };

  const removeImage = (idx: number) => {
    onChange(value.filter((_, i) => i !== idx));
  };

  return (
    <View style={{ marginBottom: 16 }}>
      <View style={styles.headerRow}>
        <Text style={[styles.label, { color: colors.foreground }]}>{label}</Text>
        <Text style={{ fontSize: 12, color: colors.mutedForeground }}>
          {value.length}/{max}
        </Text>
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 10 }}>
        {value.map((url, idx) => (
          <View key={url} style={[styles.thumb, { borderColor: colors.border }]}>
            <Image source={{ uri: cldUrl(url, "w_240,h_240,c_fill") }} style={styles.img} />
            <TouchableOpacity
              onPress={() => removeImage(idx)}
              style={styles.deleteBtn}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Feather name="x" size={14} color="#fff" />
            </TouchableOpacity>
          </View>
        ))}

        {remaining > 0 && (
          <TouchableOpacity
            onPress={addImages}
            disabled={uploading}
            style={[styles.addBtn, { borderColor: colors.border, backgroundColor: colors.card }]}
          >
            {uploading ? (
              <ActivityIndicator color={colors.primary} />
            ) : (
              <>
                <Feather name="camera" size={22} color={colors.primary} />
                <Text style={{ fontSize: 11, color: colors.mutedForeground, marginTop: 4 }}>Add Photo</Text>
              </>
            )}
          </TouchableOpacity>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  headerRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 8 },
  label: { fontSize: 13, fontWeight: "600" },
  thumb: { width: 100, height: 100, borderRadius: 12, borderWidth: 1, overflow: "hidden" },
  img: { width: "100%", height: "100%" },
  deleteBtn: {
    position: "absolute", top: 6, right: 6,
    width: 22, height: 22, borderRadius: 11,
    backgroundColor: "rgba(0,0,0,0.7)",
    justifyContent: "center", alignItems: "center",
  },
  addBtn: {
    width: 100, height: 100, borderRadius: 12, borderWidth: 1, borderStyle: "dashed",
    justifyContent: "center", alignItems: "center",
  },
});
