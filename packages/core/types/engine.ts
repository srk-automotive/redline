export const ENGINE_MANUFACTURERS = [
  "BMW",
  "Mazda",
  "Skoda",
  "Mercedes-Benz",
  "Audi",
  "Volkswagen",
  "Porsche",
  "Ferrari",
  "Lamborghini",
  "McLaren",
  "Aston Martin",
  "Bugatti",
] as const;

export type EngineManufacturer = (typeof ENGINE_MANUFACTURERS)[number];

export interface EngineClassInfo {
  id: string;
  label: string;
  description: string;
}

export const ENGINE_CLASSES = {
  CLASSIC: {
    id: "M",
    label: "Classic",
    description:
      "Traditional cam-in-block design with solid lifters (e.g., M20, Mazda BP).",
  },
  MODERN: {
    id: "N",
    label: "Modern Classic",
    description:
      "Standard production engine with modern tech like VVT and hydraulic lifters (e.g., N52, Mazda L-Series).",
  },
  MODULAR: {
    id: "B",
    label: "Modern",
    description: "Modern architecture with shared componentry (e.g., B58).",
  },
  MOTORSPORT: {
    id: "S",
    label: "Motorsport",
    description:
      "High-performance factory tuning, often featuring ITBs and upgraded internal cooling (e.g., S65).",
  },
  RACE: {
    id: "P",
    label: "Race",
    description:
      "Motorsport-exclusive hardware. Solid lifters, dry sumps, and ultra-high RPM capability (e.g., P65).",
  },
} as const;

export type EngineClass = keyof typeof ENGINE_CLASSES;

export const FUEL_TYPES = { Petrol: "B", Diesel: "D" } as const;
export type FuelType = keyof typeof FUEL_TYPES;

export type LimiterInfo = {
  rpm?: number; // RPM threshold for limiter activation
  method: "Spark" | "Fuel" | "Mixed";
  type: "Hard" | "Soft" | "Cyclic";

  hysteresis?: number; // RPM buffer before re-engaging limiter
  bounceBack?: number; // Miniumum time delay before re-engaging limiter (ms)

  retardDegrees?: number; // Timing retard (e.g., -15°) before cut
  cutPercentage?: number; // e.g., 50 for a partial/alternating cut

  isAdjustable: boolean; // Is this a fixed OEM limit or ECU-mapped?

  notes?: string; // Additional details about the limiter
} & Partial<Record<string, any>>; // Allow for additional custom properties

export type MaterialType = "Aluminum" | "Cast Iron" | "Magnesium";
