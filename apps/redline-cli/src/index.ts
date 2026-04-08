import { Command } from "commander";

import { createRequire } from "module";
import build from "./commands/build";

const require = createRequire(import.meta.url);
const { version } = require("../package.json");

const program = new Command();

program
  .name("redline")
  .description("High-revving engine fleet manager")
  .version(version || "1.0.0-SNAPSHOT");


program
  .command("build")
  .description("Interactively build or parse an engine spec")
  .option("-c, --code <code>", "Parse a Redline Engine Code (e.g. Ni40B20)")
  .option(
    "-i, --interactive",
    "Force interactive wizard mode with code as baseline",
  )
  .action(build);

program.parse(process.argv);
