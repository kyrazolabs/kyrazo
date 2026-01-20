import "dotenv/config"; // It must be the first import

import tsconfigPaths from "vite-tsconfig-paths";
import { defineConfig } from "vitest/config";

export default defineConfig({
    plugins: [tsconfigPaths()],
    test: {
        globals: true,
        environment: "node",
        coverage: {
            reporter: ["text", "html"],
        },
    },
});