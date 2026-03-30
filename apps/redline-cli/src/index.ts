import { CYLINDER_LAYOUTS, Engine, ENGINE_CLASSES } from "@redline/core";
import chalk from "chalk";
import { Command } from "commander";

const program = new Command();

program
  .name("redline")
  .description("High-revving engine fleet manager")
  .version("0.1.0");

program
  .command("build")
  .description("Interactively build or parse an engine spec")
  .option("-c, --code <code>", "Parse a Redline Engine Code (e.g. N20B20X0)")
  .action(async (options) => {
    if (options.code) {
      try {
        const engine = Engine.fromEngineCode(options.code);
        const code = engine.engineCode;

        console.log(
          `\n${chalk.bgCyan.black.bold(" ENGINE SPECIFICATION ")} ${chalk.cyan.bold(code)}`,
        );

        // --- Mechanical Core ---
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

        // --- Engineering Limits ---
        console.log(
          `\n${chalk.white.bold("📉 Engineering Limits")} (may be estimated)`,
        );
        const rpm = engine.maxRpm ?? engine.redlineRpm ?? "N/A";
        const rpmColor =
          typeof rpm === "number" && rpm >= 9000
            ? chalk.magenta.bold
            : chalk.white;

        console.log(`${chalk.gray("│")} Rev Limit:     ${rpmColor(rpm)} RPM`);

        console.log(
          `${chalk.gray("│")} Bore ${chalk.italic("x")} Stroke: ${chalk.white(`${engine.bore?.toFixed(1) ?? "N/A"}mm x ${engine.stroke?.toFixed(1) ?? "N/A"}mm`)}`,
        );

        if (engine.pistonSpeed) {
          const speed = engine.pistonSpeed;
          const speedColor = speed > 25 ? chalk.red.bold : chalk.white;
          console.log(
            `${chalk.gray("│")} Piston Speed:  ${speedColor(speed.toFixed(2))} m/s`,
          );
        }

        // --- Performance & Output ---
        if (engine.power === undefined || engine.torque === undefined) {
          const estimates = engine.estimatePerformance();

          const power = engine.power ?? estimates.power;
          const torque = engine.torque ?? estimates.torque;

          console.log(`\n${chalk.white.bold("🚀 Performance Output")}`);
          const powerStr = `${power} hp${engine.power ? "" : chalk.gray(` (est.)`)}`;
          const torqueStr = `${torque} Nm${engine.torque ? "" : chalk.gray(` (est.)`)}`;
          console.log(
            `${chalk.gray("│")} ${chalk.italic("Output")}:       ${chalk.green.bold(powerStr)} / ${chalk.green.bold(torqueStr)}`,
          );

          if (engine.powerPerLiter) {
            console.log(
              `${chalk.gray("│")} ${chalk.italic("Efficiency")}:   ${chalk.white(engine.powerPerLiter.toFixed(1))} hp/L`,
            );
          }
        }

        console.log(`\n${chalk.green("✅ Validation Passed")}\n`);
      } catch (err: any) {
        console.error(chalk.red.bold(`\n❌ Validation Error:`));
        console.error(chalk.red(`   ${err.message}\n`));
      }
    } else {
      console.log(
        chalk.yellow(
          "\n🛠️  Interactive Wizard mode coming soon. Use --code for now.\n",
        ),
      );
    }
  });

program.parse(process.argv);
