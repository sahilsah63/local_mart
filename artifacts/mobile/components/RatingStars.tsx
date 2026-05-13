import { Feather } from "@expo/vector-icons";
import React from "react";
import { StyleSheet, Text, View } from "react-native";

import { useColors } from "@/hooks/useColors";

interface Props {
  rating: number;
  count?: number;
  size?: number;
}

export function RatingStars({ rating, count, size = 14 }: Props) {
  const colors = useColors();
  const stars = Math.round(rating);

  return (
    <View style={styles.row}>
      {[1, 2, 3, 4, 5].map((i) => (
        <Feather
          key={i}
          name="star"
          size={size}
          color={i <= stars ? colors.warning : colors.border}
          style={{ marginRight: 1 }}
        />
      ))}
      <Text style={[styles.label, { color: colors.mutedForeground, fontSize: size }]}>
        {" "}
        {rating.toFixed(1)}
        {count != null ? ` (${count})` : ""}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: "row", alignItems: "center" },
  label: { marginLeft: 2 },
});
