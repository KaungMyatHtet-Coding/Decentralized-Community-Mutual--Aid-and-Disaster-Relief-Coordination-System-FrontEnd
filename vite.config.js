import tailwindcss from "@tailwindcss/vite"; // Tailwind v4 ရဲ့ Vite Plugin
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(), // ဒီကောင်လေး ပါမှ v4 style တွေ အကုန်အလုပ်လုပ်မှာပါ
  ],
});
