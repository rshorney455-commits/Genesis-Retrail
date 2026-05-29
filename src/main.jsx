import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.jsx";
import Portal from "./Portal.jsx";

function Root() {
  const path = window.location.pathname;
  if (path === "/portal" || path === "/portal/") return <Portal />;
  if (path === "/admin"  || path === "/admin/")  return <Portal />;
  return <App />;
}

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode><Root /></React.StrictMode>
);
