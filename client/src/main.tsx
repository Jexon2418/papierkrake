import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";

// Set the HTML document's title
document.title = "PapierKraken - Intelligentes Dokumentenmanagement";

// Add Inter font
const fontLink = document.createElement("link");
fontLink.rel = "stylesheet";
fontLink.href = "https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap";
document.head.appendChild(fontLink);

// Set favicon
const favicon = document.createElement("link");
favicon.rel = "icon";
favicon.href = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%231A5276' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z'/%3E%3C/svg%3E";
favicon.type = "image/svg+xml";
document.head.appendChild(favicon);

createRoot(document.getElementById("root")!).render(<App />);
