import { Engine, EngineParams } from "./Engine";
import {
  ENGINE_CLASSES,
  EngineClass,
  EngineManufacturer,
  FUEL_TYPES,
  FuelType,
} from "../types/engine";
import { InductionSystem } from "../types/induction";

export class EngineBuilder {
  private params: Partial<EngineParams> = {};

  manufacturer(manufacturer: EngineManufacturer): EngineBuilder {
    this.params.manufacturer = manufacturer;
    return this;
  }

  engineClass(engineClass: EngineClass): EngineBuilder {
    this.params.engineClass = engineClass;
    return this;
  }

  cylinders(cylinders: number): EngineBuilder {
    this.params.noCylinders = cylinders;
    return this;
  }

  displacement(displacement: number): EngineBuilder {
    this.params.displacement = displacement;
    return this;
  }

  fuelType(fuelType: FuelType): EngineBuilder {
    this.params.fuelType = fuelType;
    return this;
  }

  power(power: number): EngineBuilder {
    this.params.power = power;
    return this;
  }

  torque(torque: number): EngineBuilder {
    this.params.torque = torque;
    return this;
  }

  bore(bore: number): EngineBuilder {
    this.params.bore = bore;
    return this;
  }

  stroke(stroke: number): EngineBuilder {
    this.params.stroke = stroke;
    return this;
  }

  maxRpm(maxRpm: number): EngineBuilder {
    this.params.maxRpm = maxRpm;
    return this;
  }

  compressionRatio(ratio: number): EngineBuilder {
    this.params.compressionRatio = ratio;
    return this;
  }

  induction(induction: InductionSystem): EngineBuilder {
    this.params.induction = induction;
    return this;
  }

  throttle(throttle: "Cable" | "Wire" | "ITBs"): EngineBuilder {
    this.params.throttle = throttle;
    return this;
  }

  valvetrain(valvetrain: "Hydraulic" | "Solid" | "Electronic"): EngineBuilder {
    this.params.valvetrain = valvetrain;
    return this;
  }

  vvt(vvt: "None" | "Single" | "Dual" | "Variable Lift"): EngineBuilder {
    this.params.vvt = vvt;
    return this;
  }

  drySump(drySump: boolean): EngineBuilder {
    this.params.drySump = drySump;
    return this;
  }

  limiters(
    limiters: Record<number, import("../types/engine").LimiterInfo>,
  ): EngineBuilder {
    this.params.limiters = limiters;
    return this;
  }

  blockMaterial(
    material: import("../types/engine").MaterialType,
  ): EngineBuilder {
    this.params.blockMaterial = material;
    return this;
  }

  headMaterial(
    material: import("../types/engine").MaterialType,
  ): EngineBuilder {
    this.params.headMaterial = material;
    return this;
  }

  deckDesign(design: "Open" | "Closed" | "Semi-Closed"): EngineBuilder {
    this.params.deckDesign = design;
    return this;
  }

  oemEngineCode(code: string): EngineBuilder {
    this.params.oemEngineCode = code;
    return this;
  }

  build(): Engine {
    if (
      !this.params.manufacturer ||
      !this.params.engineClass ||
      this.params.noCylinders === undefined ||
      !this.params.displacement ||
      !this.params.fuelType
    ) {
      throw new Error(
        "Required fields not set: manufacturer, engineClass, noCylinders, displacement, fuelType",
      );
    }
    return new Engine(this.params as EngineParams);
  }

  // Static method to parse engine code
  static fromEngineCode(
    code: string,
    additionalParams: Partial<EngineParams> = {},
  ): Engine {
    if (code.length < 5) {
      throw new Error("Engine code must be at least 5 characters long");
    }

    const classId = code[0];
    const cylinderCount = parseInt(code[1]);
    const aspirationCode = code[2];
    const fuelCode = code[3];
    const displacementCode = parseInt(code.slice(4)) / 10; // Convert back from *10

    if (isNaN(cylinderCount) || isNaN(displacementCode)) {
      throw new Error("Invalid engine code format");
    }

    // Find engine class from ID
    const engineClass = Object.keys(ENGINE_CLASSES).find(
      (key) =>
        ENGINE_CLASSES[key as keyof typeof ENGINE_CLASSES].id === classId,
    ) as EngineClass;
    if (!engineClass) {
      throw new Error(`Unknown engine class ID: ${classId}`);
    }

    // Parse fuel type
    const fuelType = Object.keys(FUEL_TYPES).find(
      (key) => FUEL_TYPES[key as keyof typeof FUEL_TYPES] === fuelCode,
    ) as FuelType;
    if (!fuelType) {
      throw new Error(`Unknown fuel type code: ${fuelCode}`);
    }

    // Parse aspiration
    let induction: InductionSystem;
    switch (aspirationCode) {
      case "0":
        induction = { aspiration: "Naturally Aspirated" };
        break;
      case "1":
        induction = { aspiration: "Naturally Aspirated" };
        break;
      case "3":
        induction = {
          aspiration: "Supercharged",
          chargers: [{ __type: "Supercharger" }],
        };
        break;
      case "4":
        induction = {
          aspiration: "Turbocharged",
          chargers: [{ __type: "Turbocharger" }],
        };
        break;
      case "5":
        induction = {
          aspiration: "Turbocharged",
          chargers: [{ __type: "Turbocharger", type: "Hybrid" }],
        };
        break;
      case "6":
        induction = {
          aspiration: "Turbocharged",
          chargers: [{ __type: "Turbocharger" }, { __type: "Turbocharger" }],
        };
        break;
      case "8":
        induction = {
          aspiration: "Twincharged",
          chargers: [{ __type: "Supercharger" }, { __type: "Turbocharger" }],
        };
        break;
      case "9":
        induction = {
          aspiration: "Twincharged",
          chargers: [
            { __type: "Supercharger" },
            { __type: "Turbocharger" },
            { __type: "Turbocharger" },
          ],
        };
        break;
      default:
        throw new Error(`Unknown aspiration code: ${aspirationCode}`);
    }

    const params: EngineParams = {
      manufacturer: additionalParams.manufacturer ?? "BMW", // Default fallback
      engineClass,
      noCylinders: cylinderCount,
      displacement: displacementCode,
      fuelType,
      induction,
      ...additionalParams, // Override with provided params
    };

    return new Engine(params);
  }
}
