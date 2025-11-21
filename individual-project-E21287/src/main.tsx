import { createRoot } from "react-dom/client"; // React 18 method to create a root for rendering
import App from "./App.tsx"; // Main App component
import "./index.css"; // Global CSS styles

// Enforce HTTPS for production, but allow local/private networks during development
if (typeof window !== "undefined") { // Ensure code runs only in browser environment
  const { protocol, hostname, pathname, search, hash } = window.location; // Extract parts of current URL

  // Check if the hostname is a loopback address (localhost or equivalent)
  const isLoopback = ["localhost", "127.0.0.1", "::1"].includes(hostname);

  // Check if the hostname is a private IPv4 address
  const isPrivateIPv4 =
    /^10\.\d+\.\d+\.\d+$/.test(hostname) ||
    /^192\.168\.\d+\.\d+$/.test(hostname) ||
    /^172\.(1[6-9]|2\d|3[0-1])\.\d+\.\d+$/.test(hostname);

  // Check if the app is running in development mode
  const isDev = import.meta.env.MODE !== "production";

  // Determine if we should redirect to HTTPS
  const shouldRedirect = protocol === "http:" && !isLoopback && !isPrivateIPv4 && !isDev;

  // Redirect to HTTPS if needed
  if (shouldRedirect) {
    window.location.replace(`https://${hostname}${pathname}${search}${hash}`);
  }
}

// Create the React root and render the main App component
createRoot(document.getElementById("root")!).render(<App />);
