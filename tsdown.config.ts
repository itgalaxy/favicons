import { defineConfig } from "tsdown";

export default defineConfig({
  entry: ["./src/index"],
  clean: true,
  format: {
    esm: {
      target: ["es2024"],
    },
    cjs: {
      target: ["node20"],
      dts: {
        cjsReexport: true,
      },
    },
  },
});
