import { ReactNode } from "react";
import styles from "./SectionHeading.module.css";

/** A small uppercase sub-heading with a line running out to its right. */
export function SectionHeading({ children }: { children: ReactNode }) {
  return <h3 className={styles.sectionHeading}>{children}</h3>;
}
