import React from "react";

interface ButtonBarProps {
  children: React.ReactNode;
  className?: string;
  centered?: boolean;
}

export function ButtonBar({ children, className, centered = false }: ButtonBarProps) {

  if (centered) {
    return (
      <div className={`button-bar button-bar-sticky ${className}`}>
        <div className="container-fluid centered">
          <div className="d-flex row">
            {children}
          </div>
        </div>
      </div>      
    );
  }

  return (
    <div className={`button-bar my-3 d-flex ${className}`}>{children}</div>
  );
}
