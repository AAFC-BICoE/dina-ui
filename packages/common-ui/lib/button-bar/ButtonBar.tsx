import React from "react";
import classNames from "classnames";

interface ButtonBarProps {
  children: React.ReactNode;
  className?: string;
  centered?: boolean;
  /** Sticks the button bar to the top of the page when scrolling. Defaults to true. */
  sticky?: boolean;
}

export function ButtonBar({
  children,
  className,
  centered = true,
  sticky = true
}: ButtonBarProps) {
  if (centered) {
    return (
      <div
        className={classNames(
          "button-bar",
          sticky && "button-bar-sticky",
          className
        )}
      >
        <div className="container-fluid centered">
          <div className="d-flex row">{children}</div>
        </div>
      </div>
    );
  }

  return (
    <div
      className={classNames(
        "button-bar my-3 d-flex",
        sticky && "button-bar-sticky",
        className
      )}
    >
      {children}
    </div>
  );
}
