import { CYLINDER_LAYOUTS, Engine, ENGINE_CLASSES } from "@redline/core";
import chalk from "chalk";
import { Command } from "commander";
import pkg from "enquirer";
const { prompt } = pkg;

const program = new Command();

program
  .name("redline")
  .description("High-revving engine fleet manager")
  .version("0.1.0");

/**
 * Helper to solve for stroke based on a target bore and displacement
 */
const solveStroke = (engine: Engine, bore: number): string => {
  const vCylMm3 = (engine.displacement / engine.noCylinders) * 1_000_000;
  const stroke = vCylMm3 / (Math.PI * Math.pow(bore / 2, 2));
  return stroke.toFixed(2);
};

program
  .command("build")
  .description("Interactively build or parse an engine spec")
  .option("-c, --code <code>", "Parse a Redline Engine Code (e.g. Ni40B20)")
  .option(
    "-i, --interactive",
    "Force interactive wizard mode with code as baseline",
  )
  .action(async (options) => {
    let engineCode = options.code;

    if (!engineCode) {
      console.log(chalk.cyan.bold("\n🛠️  Redline Engine Builder Wizard\n"));
      const response = await prompt<{ code: string }>({
        type: "input",
        name: "code",
        message: "Enter base Engine Code (e.g., Ni40B20):",
        validate: (val) => (val.length >= 6 ? true : "Code too short"),
      });
      engineCode = response.code;
    }

    try {
      const baseEngine = Engine.fromEngineCode(engineCode);
      const basePerf = baseEngine.estimatePerformance();
      let finalParams: any = {};

      if (options.interactive || !options.code) {
        console.log(
          chalk.gray(`\nFine-tuning specs for ${chalk.cyan(engineCode)}...`),
        );
        console.log(
          chalk.gray(
            `(Bore/Stroke reactively update to maintain ${baseEngine.displacement}L)\n`,
          ),
        );

        const overrides = await prompt<any>([
          {
            type: "input",
            name: "bore",
            message: "Bore (mm):",
            initial: baseEngine.bore?.toString(),
            format(value: string) {
              return value === (this as any).initial
                ? chalk.gray(value)
                : chalk.green.bold(value);
            },
          },
          {
            type: "input",
            name: "stroke",
            message: function (this: any) {
              // 'this.prev' refers to the Bore prompt object
              const currentBore =
                parseFloat(this.prev.value) || baseEngine.bore || 86;
              const required = solveStroke(baseEngine, currentBore);
              return `Stroke (mm) [Required for ${baseEngine.displacement}L: ${chalk.yellow(required)}]:`;
            } as any,
            initial: function (this: any) {
              const currentBore =
                parseFloat(this.prev.value) || baseEngine.bore || 86;
              return solveStroke(baseEngine, currentBore);
            } as any,
            format(value: string) {
              return value === (this as any).initial
                ? chalk.gray(value)
                : chalk.green.bold(value);
            },
          },
          {
            type: "input",
            name: "maxRpm",
            message: `Max RPM Limit:`,
            initial: baseEngine.maxRpm?.toString(),
            format(value: string) {
              return value === (this as any).initial
                ? chalk.magenta(value)
                : chalk.magentaBright.bold(value);
            },
          },
          {
            type: "input",
            name: "power",
            message: "Target Power (hp):",
            initial: basePerf.power.toString(),
            format(value: string) {
              return value === (this as any).initial
                ? chalk.gray(value)
                : chalk.green.bold(value);
            },
          },
          {
            type: "input",
            name: "torque",
            message: "Target Torque (Nm):",
            initial: basePerf.torque.toString(),
            format(value: string) {
              return value === (this as any).initial
                ? chalk.gray(value)
                : chalk.green.bold(value);
            },
          },
        ]);

        finalParams = {
          bore:
            overrides.bore !== baseEngine.bore?.toString()
              ? parseFloat(overrides.bore)
              : undefined,
          // Stroke is almost always "overridden" by the reactive solver to ensure displacement matches
          stroke: parseFloat(overrides.stroke),
          maxRpm:
            overrides.maxRpm !== baseEngine.maxRpm?.toString()
              ? parseInt(overrides.maxRpm)
              : undefined,
          power:
            overrides.power !== basePerf.power.toString()
              ? parseFloat(overrides.power)
              : undefined,
          torque:
            overrides.torque !== basePerf.torque.toString()
              ? parseFloat(overrides.torque)
              : undefined,
          isEstimated:
            overrides.power === basePerf.power.toString() &&
            overrides.torque === basePerf.torque.toString(),
        };
      }

      const engine = Engine.fromEngineCode(engineCode, finalParams);

      console.log(
        `\n${chalk.bgCyan.black.bold(" ENGINE SPECIFICATION ")} ${chalk.cyan.bold(engine.engineCode)}`,
      );

      console.log(`\n${chalk.white.bold("🛠️  Mechanical Core")}`);
      console.log(
        `${chalk.gray("│")} ${chalk.italic("Manufacturer")}    ${chalk.white(engine.manufacturer)}`,
      );
      console.log(
        `${chalk.gray("│")} ${chalk.italic("Class")}           ${chalk.magentaBright(ENGINE_CLASSES[engine.engineClass].label)}`,
      );
      console.log(
        `${chalk.gray("│")} ${chalk.italic("Configuration")}   ${chalk.white(`${engine.displacement.toFixed(1)}L ${CYLINDER_LAYOUTS[engine.cylinderLayout]}${engine.noCylinders}`)}`,
      );
      console.log(
        `${chalk.gray("│")} ${chalk.italic("Aspiration")}      ${chalk.yellow(engine.induction.aspiration)}`,
      );
      console.log(
        `${chalk.gray("│")} ${chalk.italic("Fuel Type")}       ${chalk.white(engine.fuelType)}`,
      );

      console.log(`\n${chalk.white.bold("📉 Engineering Limits")}`);
      const rpmColor =
        engine.maxRpm && engine.maxRpm >= 9000
          ? chalk.magenta.bold
          : chalk.white;
      console.log(
        `${chalk.gray("│")} Rev Limit:     ${rpmColor(engine.maxRpm)} RPM`,
      );
      console.log(
        `${chalk.gray("│")} Bore x Stroke: ${chalk.white(`${engine.bore?.toFixed(1)}mm x ${engine.stroke?.toFixed(1)}mm`)}`,
      );

      if (engine.pistonSpeed) {
        const speedColor =
          engine.pistonSpeed > 25 ? chalk.red.bold : chalk.white;
        console.log(
          `${chalk.gray("│")} Piston Speed:  ${speedColor(engine.pistonSpeed.toFixed(2))} m/s`,
        );
      }

      const finalPerf = engine.estimatePerformance();
      console.log(`\n${chalk.white.bold("🚀 Performance Output")}`);

      const powerStr = `${engine.power ?? finalPerf.power} hp${engine.power ? "" : chalk.gray(` (est.)`)}`;
      const torqueStr = `${engine.torque ?? finalPerf.torque} Nm${engine.torque ? "" : chalk.gray(` (est.)`)}`;

      console.log(
        `${chalk.gray("│")} ${chalk.italic("Output")}:        ${chalk.green.bold(powerStr)} / ${chalk.green.bold(torqueStr)}`,
      );

      if (engine.powerPerLiter) {
        console.log(
          `${chalk.gray("│")} ${chalk.italic("Efficiency")}:    ${chalk.white(engine.powerPerLiter.toFixed(1))} hp/L`,
        );
      }

      console.log(`\n${chalk.green("✅ Validation Passed")}\n`);
    } catch (err: any) {
      console.error(chalk.red.bold(`\n❌ Error: ${err.message}\n`));
    }
  });

program.parse(process.argv);
