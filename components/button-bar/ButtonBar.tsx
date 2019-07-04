import React from "react";
import "./buttonbar.css";

export function ButtonBar(props: { children: React.ReactNode }) {
  return (
    <div className="button-bar">
      <style>{`
        body {
          padding-top: 130px !important;
        }
      `}</style>
      {props.children}
    </div>
  );
}
