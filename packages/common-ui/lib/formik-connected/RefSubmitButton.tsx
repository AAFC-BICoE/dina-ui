import { FormikProps } from "formik";
import { RefObject } from "react";
import { CommonMessage } from "../intl/common-ui-intl";
import { FaFloppyDisk } from "react-icons/fa6";

export interface RefSubmitButtonProps {
  /**
   * Ref to the form being submitted, e.g. via DinaForm's innerRef. Use this
   * button, instead of SubmitButton, when the button can't be a React
   * descendant of the form it submits (so Formik's context isn't reachable) —
   * for example a button bar rendered above the page's <main> content.
   */
  formRef: RefObject<FormikProps<any> | null>;
  children?: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
  showSaveIcon?: boolean;
}

/** Submits a form outside its own React subtree by calling formRef.current.submitForm(). */
export function RefSubmitButton({
  formRef,
  children,
  className,
  style,
  showSaveIcon = true
}: RefSubmitButtonProps) {
  return (
    <button
      type="button"
      className={`btn btn-primary ${className ?? ""}`}
      style={{ width: "10rem", ...style }}
      onClick={() => formRef.current?.submitForm()}
    >
      {showSaveIcon && <FaFloppyDisk className="me-2" />}
      {children || <CommonMessage id="submitBtnText" />}
    </button>
  );
}
