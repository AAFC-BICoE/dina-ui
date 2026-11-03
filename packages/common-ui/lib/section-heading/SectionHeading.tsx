import { ReactNode } from "react";

/** A small uppercase sub-heading with a line running out to its right. */
export function SectionHeading({ children }: { children: ReactNode }) {
  return <h3 className="section-heading">{children}</h3>;
}
