export type InductionSystem =
  | { aspiration: "Naturally Aspirated" }
  | SuperchargerSystem
  | TurbochargerSystem
  | TwinchargerSystem;

export type SuperchargerSystem = {
  aspiration: "Supercharged";
} & { chargers: Supercharger[] };

export type TurbochargerSystem = {
  aspiration: "Turbocharged";
} & { chargers: Turbocharger[] };

export type TwinchargerSystem = {
  aspiration: "Twincharged";
} & { chargers: (Supercharger | Turbocharger)[] };

export interface Supercharger {
  __type: "Supercharger";
  type?: "Roots" | "Twin-Screw" | "Centrifugal";
  boostPressure?: number; // in psi
  clutched?: boolean;
  pulleyRatio?: number; // Crank-to-Pulley ratio
}

export interface Turbocharger {
  __type: "Turbocharger";
  type?: "Twin-Scroll" | "Single-Scroll" | "Electric" | "Hybrid";
  turboSize?: number; // in mm (e.g., 50mm, 60mm)
  boostPressure?: number; // in psi
  hasWastegate?: boolean;
  wastegateType?: "Internal" | "External";
  hasBlowOffValve?: boolean;
}

/**
 * Generates an aspiration code for engine classification based on induction system.
 *
 * @param induction - The induction system configuration
 * @param maxRpm - Optional maximum RPM for high-rev detection
 * @returns A single-digit string representing the aspiration type
 *
 * @example
 * ```typescript
 * getAspirationCode({ aspiration: "Naturally Aspirated" }) // "0"
 * getAspirationCode({ aspiration: "Turbocharged", chargers: [turbo] }, 8000) // "1" (high-rev NA)
 * getAspirationCode({ aspiration: "Supercharged", chargers: [supercharger] }) // "2"
 * getAspirationCode({ aspiration: "Turbocharged", chargers: [turbo1, turbo2] }) // "5"
 * ```
 *
 * Code mapping:
 * - 0: Naturally Aspirated (standard revving)
 * - 1: Naturally Aspirated (high revving, >7000 RPM)
 * - 3: Supercharged
 * - 4: Single Turbo
 * - 5: Hybrid/Electric Turbo
 * - 6: Twin/Bi Turbos
 * - 8: Twincharged (supercharger + turbo)
 * - 9: Extra Twincharged (supercharger + multiple turbos)
 */
export function getAspirationCode(
  induction: InductionSystem,
  maxRpm?: number,
): string {
  const highRevThreshold = 7000;
  const isHighRev = maxRpm && maxRpm > highRevThreshold;

  const baseCodes: Record<string, number> = {
    "Naturally Aspirated": 0,
    Supercharged: 3,
    Turbocharged: 4,
    Twincharged: 8,
  };

  let code = baseCodes[induction.aspiration] ?? 0;

  if (induction.aspiration === "Naturally Aspirated") {
    if (isHighRev) code = 1;
  } else if (induction.aspiration === "Turbocharged") {
    const turboInduction = induction as TurbochargerSystem;
    if (turboInduction.chargers) {
      const hasElectric = turboInduction.chargers.some(
        (c) => c.type === "Electric",
      );
      const hasHybrid = turboInduction.chargers.some(
        (c) => c.type === "Hybrid",
      );

      if (hasElectric || hasHybrid) {
        code = 5; // Hybrid/Electric Turbo
      } else if (turboInduction.chargers.length > 1) {
        code = 6; // Twin/Bi Turbos
      }
      // Single turbo remains 4
    }
  } else if (induction.aspiration === "Twincharged") {
    const twinInduction = induction as TwinchargerSystem;
    const turboCount = twinInduction.chargers.filter(
      (c) => c.__type === "Turbocharger",
    ).length;
    if (turboCount > 1) {
      code = 9; // Extra Twincharged (supercharger + multiple turbos)
    }
    // Basic twincharged (super + single turbo) remains 8
  }
  // Supercharged remains 3 regardless of charger count

  return code.toString();
}
