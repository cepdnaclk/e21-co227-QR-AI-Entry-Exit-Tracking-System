import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import fs from "fs";
import os from "os";
import { componentTagger } from "lovable-tagger";

// Function to automatically get your computer’s local IP
function getLocalIp() {
  const interfaces = os.networkInterfaces();
  for (const name of Object.keys(interfaces)) {
    for (const net of interfaces[name] || []) {
      if (net.family === "IPv4" && !net.internal) {
        return net.address;
      }
    }
  }
  return "localhost";
}

const localIp = getLocalIp();

export default defineConfig(({ mode }) => ({
  server: {
    https: {
      key: fs.readFileSync("C:/localhost/localhost.key"),
      cert: fs.readFileSync("C:/localhost/localhost.crt"),
    },
    host: "0.0.0.0", // allows LAN/mobile access
    port: 8080,
    proxy: {
      "/api": {
        target: `http://${localIp}:4000`, // 👈 your actual backend IP
        changeOrigin: true,
      },
    },
  },
  plugins: [react(), mode === "development" && componentTagger()].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
}));
