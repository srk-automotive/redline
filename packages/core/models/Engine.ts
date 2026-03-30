import {
  CYLINDER_LAYOUTS,
  CylinderLayout,
  ENGINE_CLASSES,
  EngineClass,
  EngineManufacturer,
  FUEL_TYPES,
  FuelType,
  LimiterInfo,
  MaterialType,
} from "../types/engine";
import { InductionSystem, getAspirationCode } from "../types/induction";
import {
  calculateHpFromNm,
  calculateNmFromHp,
  hpToKw,
  nmToLbFt,
} from "../utils/units";
import { EngineBuilder } from "./EngineBuilder";

const PISTON_SPEED_LIMITS: Record<EngineClass, number> = {
  CLASSIC: 20, // Older metallurgy
  MODERN: 22, // Conservative/Daily
  MODULAR: 22, // Similar to Modern
  SPORT: 25, // M-cars, RS, high-end forged
  PRECISION: 28, // GT3, dedicated race builds
} as const;

const FUEL_RPM_CEILINGS: Record<FuelType, number> = {
  Petrol: 12000, // Effectively unlimited by fuel for our projects
  Diesel: 5500, // Hard physics ceiling for high-speed direct injection
} as const;

export interface EngineParams {
  // Required
  manufacturer: EngineManufacturer;
  engineClass: EngineClass;
  cylinderLayout: CylinderLayout;
  noCylinders: number;
  displacement: number; // in liters
  fuelType: FuelType;

  // Optional / Defaulted fields
  oemEngineCode?: string;
  limiters?: Record<number, LimiterInfo>; // key is RPM
  induction?: InductionSystem;
  throttle?: "Cable" | "Wire" | "ITBs";
  power?: number; // in horsepower (hp)
  torque?: number; // in Nm
  bore?: number; // in mm
  stroke?: number; // in mm
  maxRpm?: number; // in RPM
  compressionRatio?: number;
  pistonSpeed?: number; // in m/s
  valvetrain?: "Hydraulic" | "Solid" | "Electronic";
  vvt?: "None" | "Single" | "Dual" | "Variable Lift";
  blockMaterial?: MaterialType;
  headMaterial?: MaterialType;
  deckDesign?: "Open" | "Closed" | "Semi-Closed";
  drySump?: boolean;
}

export class Engine {
  public readonly manufacturer: EngineManufacturer;
  public readonly oemEngineCode?: string;

  public readonly engineClass: EngineClass;
  public readonly cylinderLayout: CylinderLayout;
  public readonly noCylinders: number;
  public readonly displacement: number; // in liters
  public readonly fuelType: FuelType;

  public readonly limiters: Record<number, LimiterInfo>;
  public readonly induction: InductionSystem;
  public readonly throttle: "Cable" | "Wire" | "ITBs";
  public readonly drySump: boolean;

  public readonly power?: number; // in hp
  public readonly torque?: number; // in Nm
  public readonly bore?: number; // in mm
  public readonly stroke?: number; // in mm
  public readonly maxRpm?: number; // Max theoretical RPM
  public readonly compressionRatio?: number; // e.g., 10.5 for a 10.5:1 ratio
  public readonly pistonSpeed?: number; // in m/s (calculated as 2 * Stroke * RPM / 60)

  public readonly valvetrain: "Hydraulic" | "Solid" | "Electronic";
  public readonly vvt: "None" | "Single" | "Dual" | "Variable Lift";

  public readonly blockMaterial?: MaterialType;
  public readonly headMaterial?: MaterialType;
  public readonly deckDesign?: "Open" | "Closed" | "Semi-Closed";

  private internalEngineCode?: string;

  constructor(params: EngineParams) {
    this.manufacturer = params.manufacturer;
    this.engineClass = params.engineClass;
    this.cylinderLayout = params.cylinderLayout;
    this.noCylinders = params.noCylinders;
    this.displacement = params.displacement;
    this.fuelType = params.fuelType;

    // Defaulting logic via Nullish Coalescing (??)
    this.oemEngineCode = params.oemEngineCode;
    this.limiters = params.limiters ?? {};
    this.induction = params.induction ?? { aspiration: "Naturally Aspirated" };
    this.throttle = params.throttle ?? "Wire";
    this.valvetrain = params.valvetrain ?? "Hydraulic";
    this.vvt = params.vvt ?? "None";
    this.drySump = params.drySump ?? false;

    // Numerical/Optional assignments
    this.power = params.power;
    this.torque = params.torque;
    this.compressionRatio = params.compressionRatio;
    this.blockMaterial = params.blockMaterial;
    this.headMaterial = params.headMaterial;
    this.deckDesign = params.deckDesign;

    // Provide estimates for missing geometry if possible
    const estimates = this.estimateGeometry({
      bore: params.bore,
      stroke: params.stroke,
      maxRpm: params.maxRpm,
    });

    this.bore = params.bore ?? estimates.bore;
    this.stroke = params.stroke ?? estimates.stroke;

    // Set maxRpm: use provided -> then redlineRpm -> then estimate
    this.maxRpm = params.maxRpm ?? this.redlineRpm ?? estimates.maxRpm;

    // Handle maxRpm: use provided or estimate from geometry or compute from limiters
    this.maxRpm = params.maxRpm ?? estimates.maxRpm ?? this.redlineRpm;

    // Handle pistonSpeed: use provided or compute from maxRpm and stroke
    this.pistonSpeed =
      params.pistonSpeed ?? (this.maxRpm && this.stroke)
        ? (2 * (this.stroke / 1000) * this.maxRpm) / 60
        : undefined;

    // Validation checks
    if (this.power !== undefined && this.power <= 0) {
      throw new Error("Power must be positive");
    }
    if (this.torque !== undefined && this.torque <= 0) {
      throw new Error("Torque must be positive");
    }
    if (this.bore !== undefined && this.bore <= 0) {
      throw new Error("Bore must be positive");
    }
    if (this.stroke !== undefined && this.stroke <= 0) {
      throw new Error("Stroke must be positive");
    }
    if (this.maxRpm !== undefined && this.maxRpm <= 0) {
      throw new Error("Max RPM must be positive");
    }
    if (this.compressionRatio !== undefined && this.compressionRatio <= 1) {
      throw new Error("Compression ratio must be greater than 1");
    }
    if (this.pistonSpeed !== undefined && this.pistonSpeed <= 0) {
      throw new Error("Piston speed must be positive");
    }

    // Validate limiter RPMs are positive
    for (const rpm of Object.keys(this.limiters).map(Number)) {
      if (rpm <= 0) {
        throw new Error("Limiter RPM must be positive");
      }
    }

    // Validate displacement if bore, stroke, and noCylinders are provided
    if (this.bore && this.stroke) {
      const computedDisplacement =
        (Math.PI *
          Math.pow(this.bore / 2, 2) *
          this.stroke *
          this.noCylinders) /
        1_000_000; // liters (1 liter = 1,000,000 mm³)
      const tolerance = 0.1; // 0.1 liters tolerance
      if (Math.abs(computedDisplacement - this.displacement) > tolerance) {
        throw new Error(
          `Computed displacement ${computedDisplacement.toFixed(2)}L does not match provided ${this.displacement}L (tolerance: ${tolerance}L)`,
        );
      }
    }

    // Validate piston speed if provided and maxRpm and stroke are available
    if (params.pistonSpeed !== undefined && this.maxRpm && this.stroke) {
      const computedPistonSpeed = (2 * (this.stroke / 1000) * this.maxRpm) / 60; // m/s
      const tolerance = 1; // 1 m/s tolerance
      if (Math.abs(computedPistonSpeed - this.pistonSpeed!) > tolerance) {
        throw new Error(
          `Computed piston speed ${computedPistonSpeed.toFixed(2)} m/s does not match provided ${this.pistonSpeed} m/s (tolerance: ${tolerance} m/s)`,
        );
      }
    }

    // Validate maxRpm if provided against limiters
    if (
      params.maxRpm !== undefined &&
      this.maxRpm &&
      this.redlineRpm &&
      this.maxRpm < this.redlineRpm
    ) {
      throw new Error(
        `Provided maxRpm ${this.maxRpm} is less than redline RPM ${this.redlineRpm} from limiters`,
      );
    }

    // Cross-validate power, torque, and maxRpm using conversion formulas
    if (this.power && this.torque && this.maxRpm) {
      const computedHp = calculateHpFromNm(this.torque, this.maxRpm);
      const hpTolerance = 5; // 5 hp tolerance
      if (Math.abs(computedHp - this.power) > hpTolerance) {
        throw new Error(
          `Computed HP ${computedHp} from torque and RPM does not match provided power ${this.power} (tolerance: ${hpTolerance} hp)`,
        );
      }

      const computedNm = calculateNmFromHp(this.power, this.maxRpm);
      const nmTolerance = 10; // 10 Nm tolerance
      if (Math.abs(computedNm - this.torque) > nmTolerance) {
        throw new Error(
          `Computed Nm ${computedNm} from power and RPM does not match provided torque ${this.torque} (tolerance: ${nmTolerance} Nm)`,
        );
      }
    }
  }

  // Static method to parse engine code
  static fromEngineCode(
    code: string,
    additionalParams: Partial<EngineParams> = {},
  ): Engine {
    return EngineBuilder.fromEngineCode(code, additionalParams);
  }

  // Computed properties
  get powerPerLiter(): number | undefined {
    return this.power ? this.power / this.displacement : undefined;
  }

  get torquePerLiter(): number | undefined {
    return this.torque ? this.torque / this.displacement : undefined;
  }

  get boreStrokeRatio(): number | undefined {
    return this.bore && this.stroke ? this.bore / this.stroke : undefined;
  }

  get redlineRpm(): number | undefined {
    const rpms = Object.keys(this.limiters).map(Number);
    return rpms.length ? Math.max(...rpms) : undefined;
  }

  get powerKw(): number | undefined {
    return this.power ? hpToKw(this.power) : undefined;
  }

  get torqueLbFt(): number | undefined {
    return this.torque ? nmToLbFt(this.torque) : undefined;
  }

  get engineCode(): string {
    return this.toEngineCode();
  }

  get displacementPerCylinder(): number {
    return this.displacement / this.noCylinders;
  }

  get pistonSpeedLimit(): number {
    return PISTON_SPEED_LIMITS[this.engineClass] || 20; // Default to conservative 20 m/s if class is somehow undefined
  }

  toEngineCode(): string {
    if (this.internalEngineCode === undefined) {
      const classId = ENGINE_CLASSES[this.engineClass].id;
      const aspirationCode = this.getAspirationCode();
      const fuelCode = FUEL_TYPES[this.fuelType];
      const displacementCode = Math.round(this.displacement * 10)
        .toString()
        .padStart(2, "0");
      const cylinderCode =
        this.noCylinders < 10
          ? this.noCylinders.toString()
          : String.fromCharCode("A".charCodeAt(0) + this.noCylinders - 10);
      const cylinderLayoutCode = CYLINDER_LAYOUTS[this.cylinderLayout];
      this.internalEngineCode = `${classId}${cylinderLayoutCode}${cylinderCode}${aspirationCode}${fuelCode}${displacementCode}`;
    }
    return this.internalEngineCode;
  }

  private getAspirationCode(): string {
    return getAspirationCode(this.induction, this.maxRpm);
  }

  /**
   * Estimates missing mechanical geometry if not provided.
   * Assumes a 'Square' bore/stroke ratio as a baseline.
   */
  public estimateGeometry(params: {
    bore?: number;
    stroke?: number;
    maxRpm?: number;
  }): { bore: number; stroke: number; maxRpm: number } {
    const vCylMm3 = (this.displacement / this.noCylinders) * 1_000_000;

    let providedBore = params.bore || this.bore;
    let providedStroke = params.stroke || this.stroke;
    let providedMaxRpm = params.maxRpm || this.maxRpm;

    // 1. Solve for Bore/Stroke (unchanged)
    if (!providedBore && !providedStroke) {
      providedStroke = Math.pow((4 * vCylMm3) / Math.PI, 1 / 3);
      providedBore = providedStroke;
    } else if (providedBore && !providedStroke) {
      const radius = providedBore / 2;
      providedStroke = vCylMm3 / (Math.PI * Math.pow(radius, 2));
    } else if (!providedBore && providedStroke) {
      providedBore = 2 * Math.sqrt(vCylMm3 / (Math.PI * providedStroke));
    }

    // 2. Solve for Max RPM with Fuel-Awareness
    if (!providedMaxRpm) {
      // Mechanical Limit based on Piston Speed
      const mechanicalLimitRpm =
        (this.pistonSpeedLimit * 60) / (2 * (providedStroke! / 1000));

      // Combustion Limit based on Fuel Type
      const combustionLimitRpm = FUEL_RPM_CEILINGS[this.fuelType];

      // Take the lower of the two
      providedMaxRpm = Math.min(mechanicalLimitRpm, combustionLimitRpm);
    }

    return {
      bore: parseFloat(providedBore!.toFixed(2)),
      stroke: parseFloat(providedStroke!.toFixed(2)),
      maxRpm: Math.floor(providedMaxRpm / 100) * 100,
    };
  }

  /**
   *
   * @param params
   * @returns
   */
  public estimatePerformance(
    params: {
      power?: number;
      torque?: number;
      maxRpm?: number;
    } = {},
  ): { power: number; torque: number; rpm: number; bmep: number } {
    const ATMOSPHERIC_PSI = 14.7;
    const workingRpm = params.maxRpm ?? this.maxRpm ?? 6000;

    let estTorque = params.torque ?? this.torque;
    let estBmep: number = 0;

    if (estTorque) {
      estBmep = estTorque / (this.displacement * 7.9577);
    } else {
      // 1. Better Fuel Baselines
      // Modern Diesels are high-compression and high-pressure by nature
      const baseBmep = this.fuelType === "Diesel" ? 16.0 : 12.5;

      const VE_MAP: Record<EngineClass, number> = {
        CLASSIC: 0.8,
        MODERN: 0.9,
        MODULAR: 0.92,
        SPORT: 0.96,
        PRECISION: 1.05,
      };
      const baseVE = VE_MAP[this.engineClass] || 0.9;

      let totalBoostPsi = 0;
      let parasiticLoss = 0;

      if (this.induction.aspiration !== "Naturally Aspirated") {
        const chargers = (this.induction as any).chargers || [];

        // Modern Diesel "Stock" assumption: ~22 psi (1.5 bar)
        // Petrol "Stock" assumption: ~8 psi (0.5 bar)
        const defaultBoost = this.fuelType === "Diesel" ? 22 : 8;

        if (chargers.length === 0) {
          totalBoostPsi = defaultBoost;
        } else {
          chargers.forEach((charger: any) => {
            const boost = charger.boostPressure || defaultBoost;
            if (charger.__type === "Supercharger") {
              totalBoostPsi += boost;
              const lossFactor = charger.type === "Roots" ? 0.12 : 0.07;
              parasiticLoss += (boost / ATMOSPHERIC_PSI) * lossFactor;
            } else {
              totalBoostPsi = Math.max(totalBoostPsi, boost);
            }
          });
        }
      }

      const pressureRatio = (ATMOSPHERIC_PSI + totalBoostPsi) / ATMOSPHERIC_PSI;
      estBmep = baseBmep * baseVE * pressureRatio * (1 - parasiticLoss);

      // Diesel RPM dropoff: Apply only after the typical torque peak (2500 RPM)
      if (this.fuelType === "Diesel" && workingRpm > 2500) {
        // Less aggressive drop-off for modern piezo-injectors
        const dropoff = Math.max(0.6, 1 - (workingRpm - 2500) / 8000);
        estBmep *= dropoff;
      }

      estTorque = estBmep * this.displacement * 7.9577;
    }

    let estPower = params.power ?? this.power;

    if (!estPower) {
      // B57 makes peak power around 4000-4400 RPM
      const rpmFactor = this.fuelType === "Diesel" ? 0.8 : 0.9;
      const peakPowerRpm = workingRpm * rpmFactor;
      estPower = calculateHpFromNm(estTorque, peakPowerRpm);
    }

    return {
      power: Math.round(estPower),
      torque: Math.round(estTorque),
      rpm: workingRpm,
      bmep: parseFloat(estBmep.toFixed(2)),
    };
  }
}
