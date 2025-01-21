import classNames from "classnames";
import { CSSProperties, useMemo } from "react";
import { useContext } from "react";
import { DinaFormContext, FieldSpy, FieldSpyRenderProps } from "..";
import { DinaFormSection, DinaFormSectionProps } from "./DinaForm";
import { find } from "lodash";

export interface FieldSetProps extends DinaFormSectionProps {
  /** fieldset title. */
  legend?: JSX.Element;

  className?: string;
  style?: CSSProperties;

  id?: string;

  /** The fieldName if  this fieldset corresponds to a DinaForm field. */
  fieldName?: string;

  /** Renders this JSX to the right of the FieldSet legend. */
  wrapLegend?: (legend: JSX.Element) => JSX.Element;

  /** Remove the padding and border around the fieldset. */
  removePadding?: boolean;
}

/** Wrapper around HTML fieldset element with Bootstrap styling. */
export function FieldSet({
  legend,
  className,
  id,
  fieldName,
  style,
  wrapLegend,
  removePadding,
  ...formSectionProps
}: FieldSetProps) {
  const context = useContext(DinaFormContext);
  const { componentName, sectionName } = formSectionProps;

  // Check the section to see if it should be visible or not.
  const disableSection = useMemo(() => {
    if (context?.formTemplate && componentName && !context?.isTemplate) {
      if (
        !context?.formTemplate?.components?.find(
          (component) => component.name === componentName
        )?.visible
      ) {
        return true;
      }
    }

    if (!context?.formTemplate || !componentName || !sectionName) return false;

    // First find the component we are looking for.
    const componentFound = find(context?.formTemplate?.components, {
      name: componentName
    });
    if (componentFound) {
      // Next find the right section.
      const sectionFound = find(componentFound?.sections, {
        name: sectionName
      });
      if (sectionFound) {
        // Check if any of the items are not visible.
        return sectionFound.items?.every((item) => item.visible === false);
      }
    }
    return false;
  }, [context?.formTemplate]);

  if (disableSection) {
    return null;
  }

  const legendElement = (
    <legend className={classNames("w-auto", fieldName && "field-label")}>
      <h2 className="fieldset-h2-adjustment">{legend}</h2>
    </legend>
  );

  const fieldSetProps = (fieldSpyProps?: FieldSpyRenderProps) => ({
    className: classNames(
      "mb-3 card",
      className,
      removePadding ? "border-0" : "border px-4 py-2"
    ),
    style,
    id,
    children: (
      <>
        <div
          className={classNames(
            "legend-wrapper",
            fieldSpyProps?.bulkContext?.bulkEditClasses,
            fieldSpyProps?.isChanged && "changed-field",
            removePadding && "d-none"
          )}
        >
          {wrapLegend?.(legendElement) ?? legendElement}
        </div>
        <DinaFormSection {...formSectionProps} />
      </>
    )
  });

  return !!context ? (
    // Show the green fieldset legend/title when the field is bulk edited:
    <FieldSpy fieldName={fieldName ?? "notAField"}>
      {(_value, fieldSpyProps) => (
        <fieldset {...fieldSetProps(fieldSpyProps)} />
      )}
    </FieldSpy>
  ) : (
    <fieldset {...fieldSetProps()} />
  );
}
