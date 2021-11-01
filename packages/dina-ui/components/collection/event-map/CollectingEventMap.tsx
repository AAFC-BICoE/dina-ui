import Head from "next/head";
import React from "react";
import { useMap, useGraphics, useGraphic, useEvent } from "esri-loader-hooks";

// interfaces for map objects
export interface EventMapSymbol {
  type: string; // autocasts as new SimpleMarkerSymbol()
  color: number[]; // array or RGB
  size: string; // pixels
}

export interface EventMapGeometry {
  type: string;
  latitude: number;
  longitude: number;
}

export interface EventMap {
  basemap: string;
}

export interface EventMapView {
  center: number[]; // array of longitude, latitude
  zoom: number;
}

export interface EventMapOptions {
  view: EventMapView;
}

export interface CollectingEventMapProps {
  latitude: number;
  longitude: number;
  geometry: EventMapGeometry;
  symbol: EventMapSymbol;
  map: EventMap;
  options: EventMapOptions;
}
// component function
export function CollectingEventMap({
  geometry,
  symbol,
  map,
  options
}: CollectingEventMapProps) {
  const [ref, view] = useMap(map, options);

  // takes a view instance and graphic as a POJO
  // the point will be replaced if the lat/lng props change
  useGraphic(view, { geometry, symbol });

  // takes a view instance and graphic as a POJO
  // the point will be replaced if the lat/lng props change
  useGraphic(view, {
    geometry,
    symbol
  });

  return (
    <div style={{ height: 800 }} ref={ref}>
      <Head>
        <link
          href="https://js.arcgis.com/4.21/esri/themes/dark/main.css"
          rel="stylesheet"
        />
      </Head>
    </div>
  );
}
