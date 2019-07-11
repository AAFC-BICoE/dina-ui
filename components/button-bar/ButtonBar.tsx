import React from "react";
import "./buttonbar.css";

export const ButtonBar = function(props: { children: React.ReactNode; }) {
  return (
      <div className="button-bar">
        <style>{`
          body {
            padding-top: 130px !important;
          }
        `}</style>
        {props.children}
      </div>
  )
}
