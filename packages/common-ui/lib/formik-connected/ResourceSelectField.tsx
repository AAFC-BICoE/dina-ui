import { KitsuResource, PersistedResource } from "kitsu";
import {
  ResourceSelect,
  ResourceSelectProps
} from "../resource-select/ResourceSelect";
import { FieldWrapper, LabelWrapperParams } from "./FieldWrapper";
import { castArray } from "lodash";
import { Fragment } from "react";
import Link from "next/link";
import classNames from "classnames";

/** The value could be one element or an array. */
export type SingleOrArray<T> = T | T[];

export interface ResourceSelectFieldProps<TData extends KitsuResource>
  extends Omit<ResourceSelectProps<TData>, "value">,
    LabelWrapperParams {
  onChange?: (value?: SingleOrArray<PersistedResource<TData>>) => void;
  isDisabled?: boolean;

  /** Link that is shown in read-only mode. */
  readOnlyLink?: string;
}

/** Formik-connected Dropdown select input for selecting a resource from the API. */
export function ResourceSelectField<TData extends KitsuResource>(
  resourceSelectFieldProps: ResourceSelectFieldProps<TData>
) {
  const { name, onChange, readOnlyLink, ...resourceSelectProps } =
    resourceSelectFieldProps;

  return (
    <FieldWrapper
      {...resourceSelectFieldProps}
      readOnlyRender={(
        value?: SingleOrArray<PersistedResource<TData> | null>
      ) => {
        const values = castArray(value);
        return (
          <div className="read-only-view">
            {values.map((resource, index) => {
              const valueText = resource
                ? resourceSelectProps.optionLabel(resource)
                : "";
              return (
                <Fragment key={resource?.id ?? index}>
                  {readOnlyLink && resource ? (
                    <Link href={readOnlyLink + resource.id}>{valueText}</Link>
                  ) : (
                    valueText
                  )}
                  {index === values.length - 1 ? "" : ", "}
                </Fragment>
              );
            })}
          </div>
        );
      }}
    >
      {({ setValue, value, invalid }) => {
        function onChangeInternal(resource) {
          setValue(resource);
          onChange?.(resource);
        }

        return (
          <ResourceSelect
            {...resourceSelectProps}
            invalid={invalid}
            onChange={onChangeInternal}
            value={value}
          />
        );
      }}
    </FieldWrapper>
  );
}
