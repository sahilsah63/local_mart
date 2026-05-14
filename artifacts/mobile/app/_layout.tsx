import {
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
  useFonts,
} from "@expo-google-fonts/inter";
import { setBaseUrl } from "@workspace/api-client-react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import React, { useEffect } from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { KeyboardProvider } from "react-native-keyboard-controller";
import { SafeAreaProvider } from "react-native-safe-area-context";

import { ErrorBoundary } from "@/components/ErrorBoundary";
import { AuthProvider } from "@/context/AuthContext";


import { BlurView } from "expo-blur";
import { isLiquidGlassAvailable } from "expo-glass-effect";
import { Tabs } from "expo-router";
import { Icon, Label, NativeTabs } from "expo-router/unstable-native-tabs";
import { SymbolView } from "expo-symbols";
import { Feather } from "@expo/vector-icons";
import { Platform, StyleSheet, View, useColorScheme } from "react-native";

import { useAuth } from "@/context/AuthContext";
import { useColors } from "@/hooks/useColors";


// const API_HOST = Platform.OS === "web"
//   ? "http://127.0.0.1:5000"           
//   : "http://172.20.10.12:5000";       
const API_HOST = process.env.EXPO_PUBLIC_DOMAIN || "https://local-mart-7zzt.onrender.com";
SplashScreen.preventAutoHideAsync();

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 30_000,
    },
  },
});


function NativeTabLayout() {
  const { user } = useAuth();
  const role = user?.role ?? "user";
  const isCustomer = role === "user";
  const bookingsLabel =
    role === "technician" ? "Jobs" : role === "shop_owner" ? "Orders" : "Bookings";

  return (
    <NativeTabs>
      <NativeTabs.Trigger name="index">
        <Icon sf={{ default: "house", selected: "house.fill" }} />
        <Label>Home</Label>
      </NativeTabs.Trigger>
      {isCustomer && (
        <NativeTabs.Trigger name="search">
          <Icon sf={{ default: "magnifyingglass", selected: "magnifyingglass" }} />
          <Label>Search</Label>
        </NativeTabs.Trigger>
      )}
      <NativeTabs.Trigger name="bookings">
        <Icon sf={{ default: "calendar", selected: "calendar.badge.clock" }} />
        <Label>{bookingsLabel}</Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="profile">
        <Icon sf={{ default: "person", selected: "person.fill" }} />
        <Label>Profile</Label>
      </NativeTabs.Trigger>
    </NativeTabs>
  );
}

function ClassicTabLayout() {
  const colors = useColors();
  const colorScheme = useColorScheme();
  const { user } = useAuth();
  const role = user?.role ?? "user";
  const isCustomer = role === "user";
  const bookingsLabel =
    role === "technician" ? "Jobs" : role === "shop_owner" ? "Orders" : "Bookings";

  const isDark = colorScheme === "dark";
  const isIOS = Platform.OS === "ios";
  const isWeb = Platform.OS === "web";

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.mutedForeground,
        headerShown: false,
        tabBarStyle: {
          position: "absolute",
          backgroundColor: isIOS ? "transparent" : colors.tabBar,
          borderTopWidth: 1,
          borderTopColor: colors.border,
          elevation: 0,
          ...(isWeb ? { height: 84 } : {}),
        },
        tabBarBackground: () =>
          isIOS ? (
            <BlurView intensity={100} tint={isDark ? "dark" : "light"} style={StyleSheet.absoluteFill} />
          ) : (
            <View style={[StyleSheet.absoluteFill, { backgroundColor: colors.tabBar }]} />
          ),
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Home",
          tabBarIcon: ({ color }) =>
            isIOS ? <SymbolView name="house.fill" tintColor={color} size={24} />
                  : <Feather name="home" size={22} color={color} />,
        }}
      />
      <Tabs.Screen
        name="search"
        options={{
          title: "Search",
          href: isCustomer ? "/search" : null,
          tabBarIcon: ({ color }) =>
            isIOS ? <SymbolView name="magnifyingglass" tintColor={color} size={24} />
                  : <Feather name="search" size={22} color={color} />,
        }}
      />
      <Tabs.Screen
        name="bookings"
        options={{
          title: bookingsLabel,
          tabBarIcon: ({ color }) =>
            isIOS ? <SymbolView name="calendar" tintColor={color} size={24} />
                  : <Feather name="calendar" size={22} color={color} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: "Profile",
          tabBarIcon: ({ color }) =>
            isIOS ? <SymbolView name="person.fill" tintColor={color} size={24} />
                  : <Feather name="user" size={22} color={color} />,
        }}
      />
    </Tabs>
  );
}

function TabLayout() {
  if (isLiquidGlassAvailable()) return <NativeTabLayout />;
  return <ClassicTabLayout />;
}








function RootLayoutNav() {
  return (
    <Stack screenOptions={{ headerBackTitle: "Back" }}>
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="auth/login" options={{ headerShown: false, presentation: "modal" }} />
      <Stack.Screen name="auth/register" options={{ headerShown: false, presentation: "modal" }} />
      <Stack.Screen name="shop/[id]" options={{ title: "Shop Details" }} />
      <Stack.Screen name="technician/[id]" options={{ title: "Technician" }} />
      <Stack.Screen name="booking/[id]" options={{ title: "Booking Details" }} />
       <Stack.Screen name="technician/onboarding" options={{ title: "Set up your profile" }} />
      <Stack.Screen name="shop/onboarding" options={{ title: "Register your Shop" }} />
      <Stack.Screen name="shop/product" options={{ title: "My Products" }} />
      <Stack.Screen name="shop/product-form" options={{ title: "Product Details" }} />
      <Stack.Screen name="+not-found" />
    </Stack>
  );
}

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
  });

  useEffect(() => {
    if (fontsLoaded || fontError) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded, fontError]);

  if (!fontsLoaded && !fontError) return null;

  return (
    <SafeAreaProvider>
      <ErrorBoundary>
        <QueryClientProvider client={queryClient}>
          <AuthProvider>
            <GestureHandlerRootView style={{ flex: 1 }}>
              <KeyboardProvider>
                <RootLayoutNav />
              </KeyboardProvider>
            </GestureHandlerRootView>
          </AuthProvider>
        </QueryClientProvider>
      </ErrorBoundary>
    </SafeAreaProvider>
  );
}




