// @ts-check
import { defineConfig } from "astro/config";

import react from "@astrojs/react";
import solidJs from "@astrojs/solid-js";
import tailwindcss from "@tailwindcss/vite";

// https://astro.build/config
export default defineConfig({
  integrations: [
    react({
      include: ["**/ui-react/**"],
    }),
    solidJs({
      include: ["**/ui-solid/**"],
    }),
  ],

  vite: {
    plugins: [tailwindcss()],
  },
});
