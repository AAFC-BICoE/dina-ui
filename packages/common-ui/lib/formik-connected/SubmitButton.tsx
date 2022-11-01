import { connect, FormikContextType } from "formik";
import { useEffect } from "react";
import {
  FormikButton,
  LoadingSpinner,
  scrollToError,
  useDinaFormContext
} from "..";
import { CommonMessage } from "../intl/common-ui-intl";

interface SubmitButtonProps {
  children?: React.ReactNode;
  className?: string;
  hidePrimaryClass?: boolean;
  performSave?: boolean;
  setPerformSave?: (newValue: boolean) => void;

  /** Override internal button props using the formik context. */
  buttonProps?: (
    ctx: FormikContextType<any>
  ) => React.HTMLProps<HTMLButtonElement>;
}

/**
 * Formik-connected submit button that shows a loading indicator instead when the form is submitting.
 */
export const SubmitButton = connect<SubmitButtonProps>(
  function SubmitButtonInternal({
    buttonProps,
    children,
    className,
    formik,
    hidePrimaryClass,
    performSave,
    setPerformSave
  }) {
    const { isNestedForm } = useDinaFormContext();

    const passedButtonProps = buttonProps?.(formik);
    const resolvedButtonProps = {
      ...passedButtonProps,
      className: `btn ${className} ${hidePrimaryClass ? "" : "btn-primary"}`,
      style: { width: "10rem", ...passedButtonProps?.style },
      onClick: (e) => {
        passedButtonProps?.onClick?.(e);
        scrollToError();
      }
    };

    useEffect(() => {
      async function tryToSave() {
        await formik.submitForm().then(() => {
          setPerformSave?.(false);
        });
      }

      if (performSave) {
        tryToSave();
      }
    }, [performSave]);

    return formik.isSubmitting ? (
      <LoadingSpinner loading={formik.isSubmitting} />
    ) : isNestedForm ? (
      <FormikButton
        className={resolvedButtonProps.className}
        buttonProps={() => resolvedButtonProps}
        onClick={async () => await formik.submitForm()}
      >
        {children || <CommonMessage id="submitBtnText" />}
      </FormikButton>
    ) : (
      <button {...resolvedButtonProps} type="submit">
        {children || <CommonMessage id="submitBtnText" />}
      </button>
    );
  }
);
