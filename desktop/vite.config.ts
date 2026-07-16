import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import path from "path";

// https://vite.dev/config/
export default defineConfig({
    plugins: [react(), tailwindcss()],

    // Path aliases
    resolve: {
        alias: {
            "@": path.resolve(__dirname, "./src"),
        },
    },

    // Tauri expects a fixed port, fail if that port is not available
    server: {
        port: 1420,
        strictPort: true,
        watch: {
            ignored: [
                "**/src-tauri/target/**",
                "**/target/**",
            ],
        },
    },

    // Prevent Vite from obscuring Rust errors
    clearScreen: false,

    // Env variables starting with TAURI_ are passed to the Tauri backend
    envPrefix: ["VITE_", "TAURI_"],

    build: {
        // Tauri uses Chromium on Windows and WebKit on macOS/Linux
        target:
            process.env.TAURI_PLATFORM === "windows"
                ? "chrome105"
                : "safari13",
        // Produce sourcemaps for debug builds only
        sourcemap: !!process.env.TAURI_DEBUG,
        // Don't minify for debug builds
        minify: !process.env.TAURI_DEBUG ? "oxc" : false,
    },
});
