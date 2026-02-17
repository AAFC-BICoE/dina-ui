"use client";
import { useEffect } from "react";

let hasLoaded = false;

export default function ArcGISLoader({
  children
}: {
  children: React.ReactNode;
}) {
  useEffect(() => {
    if (!hasLoaded) {
      import("../../lib/arcgis-config");
      hasLoaded = true;
    }
  }, []);

  return <>{children}</>;
}
