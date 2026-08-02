import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "jsdom",
    include: ["src/lib/*.test.js", "src/lib/search-field/*.test.js"],
  },
});
