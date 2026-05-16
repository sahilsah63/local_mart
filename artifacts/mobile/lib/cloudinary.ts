import * as ImagePicker from "expo-image-picker";
import { Platform } from "react-native";

import { api } from "./api";

interface SignResponse {
  signature: string;
  timestamp: number;
  apiKey: string;
  cloudName: string;
  folder: string;
  uploadUrl: string;
}

export interface UploadedImage {
  url: string;
  publicId: string;
  width: number;
  height: number;
}

/**
 * Pick image(s) from device + upload to Cloudinary.
 * Returns array of uploaded image URLs.
 */
export async function pickAndUploadImages(opts: {
  folder: "products" | "shops" | "users" | "bookings" | "reviews";
  multiple?: boolean;
  maxImages?: number;
}): Promise<UploadedImage[]> {
  // Ask permission
  const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (!perm.granted) {
    throw new Error("Photo library permission required");
  }

  // Pick
  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ImagePicker.MediaTypeOptions.Images,
    allowsMultipleSelection: !!opts.multiple,
    selectionLimit: opts.maxImages ?? 5,
    quality: 0.7,
    base64: false,
  });

  if (result.canceled || !result.assets?.length) return [];

  // Get signed config from backend
  const sign = await api.post<SignResponse>("/uploads/sign", { folder: opts.folder });

  // Upload each asset
  const uploaded: UploadedImage[] = [];
  for (const asset of result.assets) {
    const formData = new FormData();
    formData.append("file", {
      uri: Platform.OS === "ios" ? asset.uri.replace("file://", "") : asset.uri,
      type: asset.mimeType ?? "image/jpeg",
      name: asset.fileName ?? `upload-${Date.now()}.jpg`,
    } as any);
    formData.append("api_key", sign.apiKey);
    formData.append("timestamp", String(sign.timestamp));
    formData.append("signature", sign.signature);
    formData.append("folder", sign.folder);

    const res = await fetch(sign.uploadUrl, { method: "POST", body: formData as any });
    if (!res.ok) {
      const text = await res.text();
      console.error("Cloudinary upload failed:", text);
      throw new Error("Image upload failed");
    }
    const json = await res.json();
    uploaded.push({
      url: json.secure_url,
      publicId: json.public_id,
      width: json.width,
      height: json.height,
    });
  }

  return uploaded;
}

/**
 * Pick from camera and upload.
 */
export async function captureAndUploadImage(opts: {
  folder: "products" | "shops" | "users" | "bookings" | "reviews";
}): Promise<UploadedImage | null> {
  const perm = await ImagePicker.requestCameraPermissionsAsync();
  if (!perm.granted) throw new Error("Camera permission required");

  const result = await ImagePicker.launchCameraAsync({
    mediaTypes: ImagePicker.MediaTypeOptions.Images,
    quality: 0.7,
  });

  if (result.canceled || !result.assets?.length) return null;

  const sign = await api.post<SignResponse>("/uploads/sign", { folder: opts.folder });
  const asset = result.assets[0];

  const formData = new FormData();
  formData.append("file", {
    uri: Platform.OS === "ios" ? asset.uri.replace("file://", "") : asset.uri,
    type: asset.mimeType ?? "image/jpeg",
    name: `capture-${Date.now()}.jpg`,
  } as any);
  formData.append("api_key", sign.apiKey);
  formData.append("timestamp", String(sign.timestamp));
  formData.append("signature", sign.signature);
  formData.append("folder", sign.folder);

  const res = await fetch(sign.uploadUrl, { method: "POST", body: formData as any });
  if (!res.ok) throw new Error("Image upload failed");
  const json = await res.json();
  return {
    url: json.secure_url,
    publicId: json.public_id,
    width: json.width,
    height: json.height,
  };
}

/**
 * Get an optimized Cloudinary URL with transformations.
 * e.g. cldUrl(url, "w_400,h_400,c_fill") → resized thumbnail
 */
export function cldUrl(url: string, transformation = "w_800,q_auto,f_auto"): string {
  if (!url || !url.includes("/upload/")) return url;
  return url.replace("/upload/", `/upload/${transformation}/`);
}
