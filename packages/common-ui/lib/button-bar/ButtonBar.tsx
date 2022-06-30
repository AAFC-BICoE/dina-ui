import React from "react";

interface ButtonBarProps {
  children: React.ReactNode;
  className?: string;
}

export function ButtonBar({ children, className }: ButtonBarProps) {
  return (
    <div className={`button-bar d-flex ${className}`}>
      <div className="px-5 container-fluid">{children}</div>
    </div>
  );
}

export function ButtonBarRight({ children }: ButtonBarProps) {
  return <div className="button-bar-right">{children}</div>;
}
