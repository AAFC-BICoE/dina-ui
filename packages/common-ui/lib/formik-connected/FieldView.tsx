import _ from "lodash";
import moment from "moment";
import Link from "next/link";
import { FieldWrapper, FieldWrapperProps } from "./FieldWrapper";
import { Fragment, useEffect, useRef, useState } from "react";

/** Renders the label and value of a field from Formik context. */
export function FieldView(props: FieldWrapperProps) {
  return <FieldWrapper {...props} />;
}

export interface ReadOnlyValueProps {
  value: any;
  link?: string;
  bold?: boolean;
}

const COLLAPSED_HEIGHT = 100; //px
const EXPANDED_MAX_HEIGHT = 500; //px

export function ReadOnlyValue({ value, link, bold }: ReadOnlyValueProps) {
  const [expanded, setExpanded] = useState(false);
  const [isOverflowing, setIsOverflowing] = useState(false);
  const [copyStatus, setCopyStatus] = useState<"" | "copied" | "error">("");
  const contentRef = useRef<HTMLDivElement | null>(null);

  const content = link ? (
    <Link href={link}>{value}</Link>
  ) : Array.isArray(value) ? (
    value.map((val, idx) => {
      const displayString = val?.name
        ? val.name
        : val?.displayName
        ? val.displayName
        : val?.names
        ? val.names[0].name
        : typeof val === "string"
        ? val
        : JSON.stringify(val);

      return (
        <Fragment key={idx}>
          {idx <= value.length - 2 ? displayString + ", " : displayString}
        </Fragment>
      );
    })
  ) : typeof value === "string" ? (
    value
  ) : _.isDate(value) ? (
    moment(value).format()
  ) : _.isNumber(value) ? (
    value.toString()
  ) : value ? (
    JSON.stringify(value)
  ) : null;

  // Measure overflow after render
  useEffect(() => {
    const el = contentRef.current;
    if (!el) {
      setIsOverflowing(false);
      return;
    }

    // Temporarily apply collapsed height to detect if it would overflow
    const originalMaxHeight = el.style.maxHeight;
    el.style.maxHeight = `${COLLAPSED_HEIGHT}px`;
    const overflowing = el.scrollHeight > el.clientHeight;
    el.style.maxHeight = originalMaxHeight;

    setIsOverflowing(overflowing);
  }, [value]);

  // Copy plain text content
  const handleCopy = async () => {
    const el = contentRef.current;
    if (!el || !navigator.clipboard) return;

    try {
      const text = el.innerText || el.textContent || "";
      await navigator.clipboard.writeText(text);
      setCopyStatus("copied");
      setTimeout(() => setCopyStatus(""), 1500);
    } catch {
      setCopyStatus("error");
      setTimeout(() => setCopyStatus(""), 1500);
    }
  };

  const containerStyles: React.CSSProperties = {
    whiteSpace: "pre-wrap",
    fontWeight: bold ? "bold" : undefined,
    overflowWrap: "anywhere"
  };

  if (isOverflowing) {
    Object.assign(containerStyles, {
      overflowY: "auto",
      maxHeight: expanded
        ? `${EXPANDED_MAX_HEIGHT}px`
        : `${COLLAPSED_HEIGHT}px`,
      padding: "0.75rem",
      borderRadius: "0.5rem",
      border: "1px solid #e5e7eb",
      backgroundColor: "#f9fafb",
      fontSize: "0.875rem",
      lineHeight: 1.5
    });
  }

  return (
    <div
      className="field-view-container"
      style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}
    >
      <div
        ref={contentRef}
        className="field-view read-only-scroll"
        style={containerStyles}
      >
        {content}
      </div>

      {isOverflowing && (
        <div
          style={{
            display: "flex",
            gap: "0.75rem",
            alignItems: "center",
            minHeight: "1rem"
          }}
        >
          <button
            type="button"
            onClick={() => setExpanded((prev) => !prev)}
            style={{
              fontSize: "0.75rem",
              color: "#2563eb",
              background: "none",
              border: "none",
              padding: 0,
              cursor: "pointer",
              textDecoration: "underline"
            }}
          >
            {expanded ? "Show less" : "Show more"}
          </button>

          <button
            type="button"
            onClick={handleCopy}
            style={{
              fontSize: "0.75rem",
              color: "#2563eb",
              background: "none",
              border: "none",
              padding: 0,
              cursor: "pointer",
              textDecoration: "underline"
            }}
          >
            {copyStatus === "copied"
              ? "Copied"
              : copyStatus === "error"
              ? "Copy failed"
              : "Copy"}
          </button>
        </div>
      )}
    </div>
  );
}
