import { setBaseUrl } from "@workspace/api-client-react";
import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";

setBaseUrl("http://localhost:5000");

createRoot(document.getElementById("root")!).render(<App />);
