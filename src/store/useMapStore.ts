import { create } from "zustand";
import type { Database } from "@/types/database";

type Spot = Database["public"]["Tables"]["parking_spots"]["Row"];
type Profile = Database["public"]["Tables"]["profiles"]["Row"];

interface MapState {
  // Carte
  userLat: number | null;
  userLng: number | null;
  mapLat: number;
  mapLng: number;
  mapZoom: number;

  // Places
  spots: Spot[];
  selectedSpot: Spot | null;

  // Mode utilisateur
  mode: "idle" | "sharing" | "finding" | "reserving";

  // Profil
  profile: Profile | null;

  // Actions
  setUserLocation: (lat: number, lng: number) => void;
  setMapCenter: (lat: number, lng: number, zoom?: number) => void;
  setSpots: (spots: Spot[]) => void;
  upsertSpot: (spot: Spot) => void;
  removeSpot: (id: string) => void;
  selectSpot: (spot: Spot | null) => void;
  setMode: (mode: MapState["mode"]) => void;
  setProfile: (profile: Profile | null) => void;
}

export const useMapStore = create<MapState>((set) => ({
  userLat: null,
  userLng: null,
  mapLat: 48.8566,
  mapLng: 2.3522,
  mapZoom: 14,

  spots: [],
  selectedSpot: null,
  mode: "idle",
  profile: null,

  setUserLocation: (lat, lng) =>
    set({ userLat: lat, userLng: lng, mapLat: lat, mapLng: lng }),

  setMapCenter: (lat, lng, zoom) =>
    set((s) => ({ mapLat: lat, mapLng: lng, mapZoom: zoom ?? s.mapZoom })),

  setSpots: (spots) => set({ spots }),

  upsertSpot: (spot) =>
    set((s) => ({
      spots: s.spots.some((sp) => sp.id === spot.id)
        ? s.spots.map((sp) => (sp.id === spot.id ? spot : sp))
        : [...s.spots, spot],
    })),

  removeSpot: (id) =>
    set((s) => ({
      spots: s.spots.filter((sp) => sp.id !== id),
      selectedSpot: s.selectedSpot?.id === id ? null : s.selectedSpot,
    })),

  selectSpot: (spot) => set({ selectedSpot: spot }),
  setMode: (mode) => set({ mode }),
  setProfile: (profile) => set({ profile }),
}));
