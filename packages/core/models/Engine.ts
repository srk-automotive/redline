import {
  calculateHpFromNm,
  calculateNmFromHp,
  hpToKw,
  nmToLbFt,
} from "../../utils/units";
import {
  ENGINE_CLASSES,
  EngineClass,
  EngineManufacturer,
  FUEL_TYPES,
  FuelType,
  LimiterInfo,
  MaterialType,
} from "../types/engine";
import { InductionSystem, getAspirationCode } from "../types/induction";
import { EngineBuilder } from "./EngineBuilder";

export interface EngineParams {
  // Required
  manufacturer: EngineManufacturer;
  engineClass: EngineClass;
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
    this.bore = params.bore;
    this.stroke = params.stroke;
    this.compressionRatio = params.compressionRatio;
    this.blockMaterial = params.blockMaterial;
    this.headMaterial = params.headMaterial;
    this.deckDesign = params.deckDesign;

    // Handle maxRpm: use provided or compute from limiters
    if (params.maxRpm !== undefined) {
      this.maxRpm = params.maxRpm;
    } else {
      this.maxRpm = this.redlineRpm; // computed from limiters
    }

    // Handle pistonSpeed: use provided or compute from maxRpm and stroke
    if (params.pistonSpeed !== undefined) {
      this.pistonSpeed = params.pistonSpeed;
    } else if (this.maxRpm && this.stroke) {
      this.pistonSpeed = (2 * (this.stroke / 1000) * this.maxRpm) / 60; // m/s
    } else {
      this.pistonSpeed = undefined;
    }

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

  toEngineCode(): string {
    if (this.internalEngineCode === undefined) {
      const classId = ENGINE_CLASSES[this.engineClass].id;
      const aspirationCode = this.getAspirationCode();
      const fuelCode = FUEL_TYPES[this.fuelType];
      const displacementCode = Math.round(this.displacement * 10)
        .toString()
        .padStart(2, "0");
      this.internalEngineCode = `${classId}${this.noCylinders}${aspirationCode}${fuelCode}${displacementCode}`;
    }
    return this.internalEngineCode;
  }

  private getAspirationCode(): string {
    return getAspirationCode(this.induction, this.maxRpm);
  }
}
