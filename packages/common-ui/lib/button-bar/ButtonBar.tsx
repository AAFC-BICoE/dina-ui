import React from "react";

interface ButtonBarProps {
  children: React.ReactNode;
  className?: string;
}

export function ButtonBar({ children, className }: ButtonBarProps) {
  return (
    <div className={`button-bar my-3 d-flex ${className}`}>{children}</div>
  );
}
