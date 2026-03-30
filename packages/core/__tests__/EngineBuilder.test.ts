import { describe, expect, it } from "vitest";
import { Engine } from "../models/Engine";
import { EngineBuilder } from "../models/EngineBuilder";

describe("EngineBuilder", () => {
  it("should build a basic engine", () => {
    const engine = new EngineBuilder()
      .manufacturer("BMW")
      .engineClass("MODERN")
      .cylinders(4)
      .displacement(2.0)
      .fuelType("Petrol")
      .build();

    expect(engine.manufacturer).toBe("BMW");
    expect(engine.engineClass).toBe("MODERN");
    expect(engine.noCylinders).toBe(4);
    expect(engine.displacement).toBe(2.0);
    expect(engine.fuelType).toBe("Petrol");
  });

  it("should build a complete engine with all options", () => {
    const engine = new EngineBuilder()
      .manufacturer("BMW")
      .engineClass("RACE")
      .cylinders(8)
      .displacement(4.0)
      .fuelType("Petrol")
      .power(600)
      .torque(503)
      .bore(92)
      .stroke(75.7)
      .maxRpm(8500)
      .compressionRatio(12.5)
      .induction({
        aspiration: "Turbocharged",
        chargers: [
          {
            __type: "Turbocharger",
            type: "Twin-Scroll",
            turboSize: 60,
            boostPressure: 25,
            hasWastegate: true,
            hasBlowOffValve: true,
          },
        ],
      })
      .throttle("ITBs")
      .valvetrain("Solid")
      .vvt("Dual")
      .drySump(true)
      .blockMaterial("Aluminum")
      .headMaterial("Aluminum")
      .deckDesign("Closed")
      .oemEngineCode("S65B40")
      .build();

    expect(engine.manufacturer).toBe("BMW");
    expect(engine.engineClass).toBe("RACE");
    expect(engine.noCylinders).toBe(8);
    expect(engine.displacement).toBe(4.0);
    expect(engine.power).toBe(600);
    expect(engine.torque).toBe(503);
    expect(engine.bore).toBe(92);
    expect(engine.stroke).toBe(75.7);
    expect(engine.maxRpm).toBe(8500);
    expect(engine.compressionRatio).toBe(12.5);
    expect(engine.induction.aspiration).toBe("Turbocharged");
    expect(engine.throttle).toBe("ITBs");
    expect(engine.valvetrain).toBe("Solid");
    expect(engine.vvt).toBe("Dual");
    expect(engine.drySump).toBe(true);
    expect(engine.blockMaterial).toBe("Aluminum");
    expect(engine.headMaterial).toBe("Aluminum");
    expect(engine.deckDesign).toBe("Closed");
    expect(engine.oemEngineCode).toBe("S65B40");
  });

  it("should throw error when required fields are missing", () => {
    expect(() => {
      new EngineBuilder()
        .manufacturer("BMW")
        .engineClass("MODERN")
        .cylinders(4)
        // Missing displacement and fuelType
        .build();
    }).toThrow("Required fields not set");
  });

  it("should allow fluent chaining", () => {
    const builder = new EngineBuilder()
      .manufacturer("BMW")
      .engineClass("MODERN")
      .cylinders(4)
      .displacement(2.0)
      .fuelType("Petrol");

    expect(builder).toBeInstanceOf(EngineBuilder);

    const engine = builder.build();
    expect(engine).toBeInstanceOf(Engine);
  });
});
