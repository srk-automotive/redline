import { defineConfig } from "tsup";

export default defineConfig({
  entry: ["src/index.ts"],
  format: ["esm"],
  clean: true,
  // minify: true,
  tsconfig: "tsconfig.json",
  noExternal: ["@redline/core"],
  banner: {
    js: "#!/usr/bin/env node",
  },
  target: "node22",
});
