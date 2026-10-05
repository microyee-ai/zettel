import React, { Suspense, useEffect, useState } from "react";
import { createRoot } from "react-dom/client";
import "@fontsource-variable/inter";
import "./styles.css";
import Landing from "./landing/Landing";
const Workbench = React.lazy(() => import("./App"));

function Root() {
  const [app, setApp] = useState(
    location.hash.startsWith("#app") ||
      location.pathname === "/app" ||
      !!window.zettel,
  );
  useEffect(() => {
    const change = () =>
      setApp(
        location.hash.startsWith("#app") ||
          location.pathname === "/app" ||
          !!window.zettel,
      );
    window.addEventListener("hashchange", change);
    return () => window.removeEventListener("hashchange", change);
  }, []);
  return app ? (
    <Suspense
      fallback={<div className="loading-screen">Opening your workspace…</div>}
    >
      <Workbench />
    </Suspense>
  ) : (
    <Landing
      onOpen={() => {
        location.hash = "app";
      }}
    />
  );
}
createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <Root />
  </React.StrictMode>,
);
