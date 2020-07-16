import React from "react";

interface ButtonBarProps {
  children: React.ReactNode;
}

export function ButtonBar({ children }: ButtonBarProps) {
  return <div className="button-bar my-3">{children}</div>;
}
