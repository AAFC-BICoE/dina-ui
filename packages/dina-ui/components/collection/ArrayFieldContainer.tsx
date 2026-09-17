import classNames from "classnames";
import {
  FieldSet,
  FieldWrapperProps,
  prefixedFieldProps,
  useDinaFormContext
} from "common-ui";
import { FieldArray } from "formik";
import { ReactNode } from "react";

export interface ArrayFieldContainerProps<T> {
  className?: string;
  sectionId: string;
  name: string;
  legend?: React.JSX.Element;

  makeNewElement: (elements: T[]) => T;

  /** Notified after an element is added, with the new element's index. */
  onElementAdded?: (index: number) => void;
  /** Notified after an element is removed, with the remaining element count. */
  onElementRemoved?: (index: number, remaining: number) => void;

  /** Renders the elements. Return null to render nothing at all. */
  children: (ctx: ArrayFieldCtx<T>) => ReactNode;

  /** Remove the padding and border around the fieldset. */
  removePadding?: boolean;
}

export interface ArrayFieldCtx<T> {
  elements: T[];
  /** Prefixed field props for the element at the given index. */
  fieldProps: (index: number) => (fieldName: string) => FieldWrapperProps;
  addElement: () => void;
  removeElement: (index: number) => void;
  readOnly: boolean;
  isTemplate: boolean;
}

/**
 * Owns the mechanics shared by every array field: reading the elements, adding
 * and removing them, prefixing nested field names, and the surrounding FieldSet.
 *
 * Presentation is left to the caller, so the array can be rendered as tabs
 * (TabbedArrayField) or as stacked rows (InlineArrayField) without duplicating
 * any of the above.
 */
export function ArrayFieldContainer<T>({
  className,
  sectionId,
  name,
  legend,
  makeNewElement,
  onElementAdded,
  onElementRemoved,
  children,
  removePadding
}: ArrayFieldContainerProps<T>) {
  const { readOnly, isTemplate } = useDinaFormContext();

  return (
    <FieldArray name={name}>
      {(fieldArrayProps) => {
        const elements = (fieldArrayProps.form.getFieldMeta(name).value ||
          []) as T[];

        function addElement() {
          fieldArrayProps.push(makeNewElement(elements));
          onElementAdded?.(elements.length);
        }

        function removeElement(index: number) {
          fieldArrayProps.remove(index);
          onElementRemoved?.(index, elements.length - 1);
        }

        const content = children({
          elements,
          fieldProps: (index) =>
            prefixedFieldProps(`${name}[${index}]`, `${name}[0]`),
          addElement,
          removeElement,
          readOnly: !!readOnly,
          isTemplate: !!isTemplate
        });

        if (content === null) {
          return null;
        }

        return (
          <FieldSet
            className={classNames(sectionId, className)}
            id={sectionId}
            legend={legend}
            fieldName={name}
            removePadding={removePadding}
          >
            {content}
          </FieldSet>
        );
      }}
    </FieldArray>
  );
}
