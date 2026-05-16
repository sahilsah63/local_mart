import { setBaseUrl } from "@workspace/api-client-react";
import { createRoot } from "react-dom/client";
import App from "./App";
// import "./index.css";

// const API_URL =
//   (import.meta as any).env?.VITE_API_URL ||
//   "http://localhost:5000/api";

const API_URL =
  import.meta.env.VITE_API_URL ||
  "http://localhost:5000/api";

setBaseUrl(API_URL);

setBaseUrl(API_URL);

createRoot(document.getElementById("root")!).render(<App />);
