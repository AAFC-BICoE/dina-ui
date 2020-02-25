import React from "react";
import "./buttonbar.css";

interface ButtonBarProps {
  children: React.ReactNode;
}

export function ButtonBar({ children }: ButtonBarProps) {
  return (
    <div className="button-bar">
      <style>{`
          body {
            padding-top: 130px !important;
          }
        `}</style>
      {children}
    </div>
  );
}
