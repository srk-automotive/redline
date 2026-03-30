import { describe, expect, it } from "vitest";
import { Engine, EngineParams } from "../models/Engine";

describe("Engine", () => {
  describe("constructor validation", () => {
    it("should create a valid engine", () => {
      const params = {
        manufacturer: "BMW" as const,
        engineClass: "MODERN" as const,
        noCylinders: 4,
        displacement: 2.0,
        fuelType: "Petrol" as const,
      };

      expect(() => new Engine(params)).not.toThrow();
    });

    it("should throw error for negative power", () => {
      const params = {
        manufacturer: "BMW" as const,
        engineClass: "MODERN" as const,
        noCylinders: 4,
        displacement: 2.0,
        fuelType: "Petrol" as const,
        power: -100,
      };

      expect(() => new Engine(params)).toThrow("Power must be positive");
    });

    it("should throw error for negative torque", () => {
      const params = {
        manufacturer: "BMW" as const,
        engineClass: "MODERN" as const,
        noCylinders: 4,
        displacement: 2.0,
        fuelType: "Petrol" as const,
        torque: -200,
      };

      expect(() => new Engine(params)).toThrow("Torque must be positive");
    });

    it("should throw error for negative bore", () => {
      const params = {
        manufacturer: "BMW" as const,
        engineClass: "MODERN" as const,
        noCylinders: 4,
        displacement: 2.0,
        fuelType: "Petrol" as const,
        bore: -80,
      };

      expect(() => new Engine(params)).toThrow("Bore must be positive");
    });

    it("should throw error for negative stroke", () => {
      const params = {
        manufacturer: "BMW" as const,
        engineClass: "MODERN" as const,
        noCylinders: 4,
        displacement: 2.0,
        fuelType: "Petrol" as const,
        stroke: -90,
      };

      expect(() => new Engine(params)).toThrow("Stroke must be positive");
    });

    it("should throw error for negative maxRpm", () => {
      const params = {
        manufacturer: "BMW" as const,
        engineClass: "MODERN" as const,
        noCylinders: 4,
        displacement: 2.0,
        fuelType: "Petrol" as const,
        maxRpm: -7000,
      };

      expect(() => new Engine(params)).toThrow("Max RPM must be positive");
    });

    it("should throw error for compression ratio <= 1", () => {
      const params = {
        manufacturer: "BMW" as const,
        engineClass: "MODERN" as const,
        noCylinders: 4,
        displacement: 2.0,
        fuelType: "Petrol" as const,
        compressionRatio: 1,
      };

      expect(() => new Engine(params)).toThrow(
        "Compression ratio must be greater than 1",
      );
    });

    it("should throw error for negative piston speed", () => {
      const params = {
        manufacturer: "BMW" as const,
        engineClass: "MODERN" as const,
        noCylinders: 4,
        displacement: 2.0,
        fuelType: "Petrol" as const,
        pistonSpeed: -10,
      };

      expect(() => new Engine(params)).toThrow("Piston speed must be positive");
    });

    it("should validate displacement calculation", () => {
      const params = {
        manufacturer: "BMW" as const,
        engineClass: "MODERN" as const,
        noCylinders: 4,
        displacement: 2.0,
        fuelType: "Petrol" as const,
        bore: 86, // mm
        stroke: 86, // mm
      };

      // Calculated displacement should be approximately 2.0L
      expect(() => new Engine(params)).not.toThrow();
    });

    it("should throw error for mismatched displacement", () => {
      const params = {
        manufacturer: "BMW" as const,
        engineClass: "MODERN" as const,
        noCylinders: 4,
        displacement: 3.0, // Wrong displacement
        fuelType: "Petrol" as const,
        bore: 86,
        stroke: 86,
      };

      expect(() => new Engine(params)).toThrow(
        /Computed displacement .* does not match provided/,
      );
    });

    it("should validate piston speed when provided", () => {
      const params = {
        manufacturer: "BMW" as const,
        engineClass: "MODERN" as const,
        noCylinders: 4,
        displacement: 2.0,
        fuelType: "Petrol" as const,
        maxRpm: 7000,
        stroke: 86,
        pistonSpeed: 20, // Approximately correct
      };

      expect(() => new Engine(params)).not.toThrow();
    });

    it("should throw error for mismatched piston speed", () => {
      const params = {
        manufacturer: "BMW" as const,
        engineClass: "MODERN" as const,
        noCylinders: 4,
        displacement: 2.0,
        fuelType: "Petrol" as const,
        maxRpm: 7000,
        stroke: 86,
        pistonSpeed: 100, // Wrong speed
      };

      expect(() => new Engine(params)).toThrow(
        /Computed piston speed .* does not match provided/,
      );
    });

    it("should validate maxRpm against limiters", () => {
      const params: EngineParams = {
        manufacturer: "BMW" as const,
        engineClass: "MODERN" as const,
        noCylinders: 4,
        displacement: 2.0,
        fuelType: "Petrol" as const,
        maxRpm: 6000,
        limiters: {
          6500: {
            rpm: 6500,
            method: "Spark",
            type: "Hard",
            isAdjustable: true,
          },
        },
      };

      expect(() => new Engine(params)).toThrow(
        /Provided maxRpm .* is less than redline RPM/,
      );
    });

    it("should cross-validate power, torque, and maxRpm", () => {
      const params = {
        manufacturer: "BMW" as const,
        engineClass: "MODERN" as const,
        noCylinders: 4,
        displacement: 2.0,
        fuelType: "Petrol" as const,
        power: 200,
        torque: 203, // Consistent with 200hp at 7000rpm
        maxRpm: 7000,
      };

      expect(() => new Engine(params)).not.toThrow();
    });

    it("should throw error for inconsistent power/torque/maxRpm", () => {
      const params = {
        manufacturer: "BMW" as const,
        engineClass: "MODERN" as const,
        noCylinders: 4,
        displacement: 2.0,
        fuelType: "Petrol" as const,
        power: 500, // Inconsistent with torque and RPM
        torque: 300,
        maxRpm: 7000,
      };

      expect(() => new Engine(params)).toThrow(
        /Computed HP .* does not match provided power/,
      );
    });
  });

  describe("computed properties", () => {
    const baseParams = {
      manufacturer: "BMW" as const,
      engineClass: "MODERN" as const,
      noCylinders: 4,
      displacement: 2.0,
      fuelType: "Petrol" as const,
    };

    it("should calculate powerPerLiter", () => {
      const engine = new Engine({ ...baseParams, power: 200 });
      expect(engine.powerPerLiter).toBe(100);
    });

    it("should return undefined for powerPerLiter when power is not set", () => {
      const engine = new Engine(baseParams);
      expect(engine.powerPerLiter).toBeUndefined();
    });

    it("should calculate torquePerLiter", () => {
      const engine = new Engine({ ...baseParams, torque: 300 });
      expect(engine.torquePerLiter).toBe(150);
    });

    it("should calculate boreStrokeRatio", () => {
      const engine = new Engine({ ...baseParams, bore: 86, stroke: 86 });
      expect(engine.boreStrokeRatio).toBe(1);
    });

    it("should return undefined for boreStrokeRatio when bore or stroke is missing", () => {
      const engine = new Engine({ ...baseParams, bore: 86 });
      expect(engine.boreStrokeRatio).toBeUndefined();
    });

    it("should calculate redlineRpm from limiters", () => {
      const engine = new Engine({
        ...baseParams,
        limiters: {
          6500: {
            rpm: 6500,
            method: "Spark",
            type: "Hard",
            isAdjustable: true,
          },
          7000: {
            rpm: 7000,
            method: "Fuel",
            type: "Soft",
            isAdjustable: false,
          },
        },
      });
      expect(engine.redlineRpm).toBe(7000);
    });

    it("should return undefined for redlineRpm when no limiters", () => {
      const engine = new Engine(baseParams);
      expect(engine.redlineRpm).toBeUndefined();
    });

    it("should calculate powerKw", () => {
      const engine = new Engine({ ...baseParams, power: 200 });
      expect(engine.powerKw).toBe(149.1); // 200 hp = 149.1 kW (rounded to 1 decimal)
    });

    it("should calculate torqueLbFt", () => {
      const engine = new Engine({ ...baseParams, torque: 300 });
      expect(engine.torqueLbFt).toBe(221.3); // 300 Nm = 221.3 lb-ft (rounded to 1 decimal)
    });

    it("should return cached internalEngineCode", () => {
      const engine = new Engine(baseParams);
      expect(engine.engineCode).toBe("N40B20");
      // Call again to ensure it's cached
      expect(engine.engineCode).toBe("N40B20");
    });
  });

  describe("toEngineCode", () => {
    const baseParams = {
      manufacturer: "BMW" as const,
      engineClass: "MODERN" as const,
      noCylinders: 4,
      displacement: 2.0,
      fuelType: "Petrol" as const,
    };

    it("should generate code for naturally aspirated engine", () => {
      const engine = new Engine({
        ...baseParams,
        induction: { aspiration: "Naturally Aspirated" },
      });
      expect(engine.toEngineCode()).toBe("N40B20");
    });

    it("should generate code for high-rev naturally aspirated engine", () => {
      const engine = new Engine({
        ...baseParams,
        induction: { aspiration: "Naturally Aspirated" },
        maxRpm: 8000,
      });
      expect(engine.toEngineCode()).toBe("N41B20");
    });

    it("should generate code for supercharged engine", () => {
      const engine = new Engine({
        ...baseParams,
        induction: {
          aspiration: "Supercharged",
          chargers: [
            {
              __type: "Supercharger",
              type: "Roots",
              boostPressure: 10,
              clutched: true,
              pulleyRatio: 2,
            },
          ],
        },
      });
      expect(engine.toEngineCode()).toBe("N43B20");
    });

    it("should generate code for single turbo engine", () => {
      const engine = new Engine({
        ...baseParams,
        induction: {
          aspiration: "Turbocharged",
          chargers: [
            {
              __type: "Turbocharger",
              type: "Single-Scroll",
              turboSize: 50,
              boostPressure: 20,
              hasWastegate: true,
              hasBlowOffValve: true,
            },
          ],
        },
      });
      expect(engine.toEngineCode()).toBe("N44B20");
    });

    it("should generate code for hybrid turbo engine", () => {
      const engine = new Engine({
        ...baseParams,
        induction: {
          aspiration: "Turbocharged",
          chargers: [
            {
              __type: "Turbocharger",
              type: "Hybrid",
              turboSize: 50,
              boostPressure: 20,
              hasWastegate: true,
              hasBlowOffValve: true,
            },
          ],
        },
      });
      expect(engine.toEngineCode()).toBe("N45B20");
    });

    it("should generate code for twin turbo engine", () => {
      const engine = new Engine({
        ...baseParams,
        induction: {
          aspiration: "Turbocharged",
          chargers: [
            {
              __type: "Turbocharger",
              type: "Twin-Scroll",
              turboSize: 50,
              boostPressure: 20,
              hasWastegate: true,
              hasBlowOffValve: true,
            },
            {
              __type: "Turbocharger",
              type: "Twin-Scroll",
              turboSize: 50,
              boostPressure: 20,
              hasWastegate: true,
              hasBlowOffValve: true,
            },
          ],
        },
      });
      expect(engine.toEngineCode()).toBe("N46B20");
    });

    it("should generate code for twincharged engine", () => {
      const engine = new Engine({
        ...baseParams,
        induction: {
          aspiration: "Twincharged",
          chargers: [
            {
              __type: "Supercharger",
              type: "Roots",
              boostPressure: 10,
              clutched: true,
              pulleyRatio: 2,
            },
            {
              __type: "Turbocharger",
              type: "Single-Scroll",
              turboSize: 50,
              boostPressure: 20,
              hasWastegate: true,
              hasBlowOffValve: true,
            },
          ],
        },
      });
      expect(engine.toEngineCode()).toBe("N48B20");
    });

    it("should generate code for extra twincharged engine", () => {
      const engine = new Engine({
        ...baseParams,
        induction: {
          aspiration: "Twincharged",
          chargers: [
            {
              __type: "Supercharger",
              type: "Roots",
              boostPressure: 10,
              clutched: true,
              pulleyRatio: 2,
            },
            {
              __type: "Turbocharger",
              type: "Twin-Scroll",
              turboSize: 50,
              boostPressure: 20,
              hasWastegate: true,
              hasBlowOffValve: true,
            },
            {
              __type: "Turbocharger",
              type: "Twin-Scroll",
              turboSize: 50,
              boostPressure: 20,
              hasWastegate: true,
              hasBlowOffValve: true,
            },
          ],
        },
      });
      expect(engine.toEngineCode()).toBe("N49B20");
    });

    it("should handle diesel fuel type", () => {
      const engine = new Engine({
        ...baseParams,
        fuelType: "Diesel",
        induction: { aspiration: "Naturally Aspirated" },
      });
      expect(engine.toEngineCode()).toBe("N40D20");
    });

    it("should handle different engine classes", () => {
      const engine = new Engine({
        ...baseParams,
        engineClass: "RACE",
        induction: { aspiration: "Naturally Aspirated" },
      });
      expect(engine.toEngineCode()).toBe("P40B20");
    });
  });
});

describe("Engine.fromEngineCode", () => {
  it("should parse naturally aspirated engine code", () => {
    const engine = Engine.fromEngineCode("N40B20");
    expect(engine.engineClass).toBe("MODERN");
    expect(engine.noCylinders).toBe(4);
    expect(engine.displacement).toBe(2.0);
    expect(engine.fuelType).toBe("Petrol");
    expect(engine.induction.aspiration).toBe("Naturally Aspirated");
  });

  it("should parse high-rev naturally aspirated engine code", () => {
    const engine = Engine.fromEngineCode("N41B20", { maxRpm: 8000 });
    expect(engine.induction.aspiration).toBe("Naturally Aspirated");
  });

  it("should parse supercharged engine code", () => {
    const engine = Engine.fromEngineCode("N43B20");
    expect(engine.induction.aspiration).toBe("Supercharged");

    if (engine.induction.aspiration === "Supercharged")
      expect(engine.induction.chargers).toHaveLength(1);
  });

  it("should parse single turbo engine code", () => {
    const engine = Engine.fromEngineCode("N44B20");
    expect(engine.induction.aspiration).toBe("Turbocharged");

    if (engine.induction.aspiration === "Turbocharged")
      expect(engine.induction.chargers).toHaveLength(1);
  });

  it("should parse twin turbo engine code", () => {
    const engine = Engine.fromEngineCode("N46B20");
    expect(engine.induction.aspiration).toBe("Turbocharged");

    if (engine.induction.aspiration === "Turbocharged")
      expect(engine.induction.chargers).toHaveLength(2);
  });

  it("should parse twincharged engine code", () => {
    const engine = Engine.fromEngineCode("N48B20");
    expect(engine.induction.aspiration).toBe("Twincharged");

    if (engine.induction.aspiration === "Twincharged")
      expect(engine.induction.chargers).toHaveLength(2);
  });

  it("should parse extra twincharged engine code", () => {
    const engine = Engine.fromEngineCode("N49B20");
    expect(engine.induction.aspiration).toBe("Twincharged");

    if (engine.induction.aspiration === "Twincharged")
      expect(engine.induction.chargers).toHaveLength(3);
  });

  it("should handle diesel fuel type", () => {
    const engine = Engine.fromEngineCode("N40D20");
    expect(engine.fuelType).toBe("Diesel");
  });

  it("should handle different engine classes", () => {
    const engine = Engine.fromEngineCode("P40B20");
    expect(engine.engineClass).toBe("RACE");
  });

  it("should merge with additional params", () => {
    const engine = Engine.fromEngineCode("N40B20", {
      manufacturer: "Audi",
      power: 150,
    });
    expect(engine.manufacturer).toBe("Audi");
    expect(engine.power).toBe(150);
  });

  it("should throw error for invalid code length", () => {
    expect(() => Engine.fromEngineCode("N40")).toThrow(
      "Engine code must be at least 5 characters long",
    );
  });

  it("should throw error for unknown class ID", () => {
    expect(() => Engine.fromEngineCode("X40B20")).toThrow(
      "Unknown engine class ID: X",
    );
  });

  it("should throw error for unknown fuel code", () => {
    expect(() => Engine.fromEngineCode("N40X20")).toThrow(
      "Unknown fuel type code: X",
    );
  });

  it("should throw error for unknown aspiration code", () => {
    expect(() => Engine.fromEngineCode("N42B20")).toThrow(
      "Unknown aspiration code: 2",
    );
  });
});
