import { useQuery } from "@tanstack/react-query";

import { api } from "@/lib/api";

export interface UserLocation {
  id: number;
  name: string;
  role: string;
  currentLat: number | null;
  currentLng: number | null;
  lastLocationAt: string | null;
}

export interface BookingLocations {
  bookingId: number;
  status: string;
  customer: UserLocation | null;
  provider: UserLocation | null;
  fetchedAt: string;
}

export function useBookingLocations(bookingId: number | null, enabled = true) {
  return useQuery<BookingLocations>({
    queryKey: ["booking-locations", bookingId],
    queryFn: () => api.get(`/location/booking/${bookingId}`),
    enabled: !!bookingId && enabled,
    refetchInterval: 10_000, // pull every 10 sec
    refetchIntervalInBackground: false,
    retry: 1,
  });
}

// Haversine helper - distance between 2 points in km
export function distanceKm(
  a: { lat: number; lng: number },
  b: { lat: number; lng: number }
): number {
  const R = 6371;
  const dLat = ((b.lat - a.lat) * Math.PI) / 180;
  const dLng = ((b.lng - a.lng) * Math.PI) / 180;
  const lat1 = (a.lat * Math.PI) / 180;
  const lat2 = (b.lat * Math.PI) / 180;

  const x =
    Math.sin(dLat / 2) ** 2 +
    Math.sin(dLng / 2) ** 2 * Math.cos(lat1) * Math.cos(lat2);
  return 2 * R * Math.asin(Math.sqrt(x));
}

// Rough ETA assuming avg city speed 25 km/h
export function etaMinutes(distKm: number): number {
  return Math.ceil((distKm / 25) * 60);
}