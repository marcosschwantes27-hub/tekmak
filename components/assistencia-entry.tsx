import { createRoot } from "react-dom/client";
import AssistenciaTecnicaOrbital from "./assistencia-tecnica-orbital";
import "../styles/globals.css";
import "../styles/assistencia-orbita.css";

const mount = document.getElementById("assistencia-orbita-root");
if (mount) createRoot(mount).render(<AssistenciaTecnicaOrbital />);
