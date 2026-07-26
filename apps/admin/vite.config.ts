import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

export default defineConfig({
  envDir: "../..",
  envPrefix: ["VITE_", "EXPO_PUBLIC_SUPABASE_"],
  plugins: [react()],
});
