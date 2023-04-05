import { KitsuResource, PersistedResource } from "kitsu";
import { castArray, compact } from "lodash";
import Link from "next/link";
import { Fragment } from "react";
import {
  FieldWrapper,
  isShallowReference,
  FieldWrapperProps,
  ResourceSelect,
  ResourceSelectProps,
  useBulkGet
} from "..";

/** The value could be one element or an array. */
export type SingleOrArray<T> = T | T[];

export interface ResourceSelectFieldProps<TData extends KitsuResource>
  extends Omit<ResourceSelectProps<TData>, "value">,
    FieldWrapperProps {
  onChange?: (value?: SingleOrArray<PersistedResource<TData>>) => void;
  isDisabled?: boolean;

  /** Link that is shown in read-only mode. */
  readOnlyLink?: string;

  /** If true, disable the dropdown when the selected option is the only one available */
  cannotBeChanged?: boolean;
}

/** Formik-connected Dropdown select input for selecting a resource from the API. */
export function ResourceSelectField<TData extends KitsuResource>(
  resourceSelectFieldProps: ResourceSelectFieldProps<TData>
) {
  const { name, onChange, readOnlyRender, ...resourceSelectProps } =
    resourceSelectFieldProps;

  const defaultReadOnlyRender = (
    value?: SingleOrArray<PersistedResource<TData> | null>
  ) => (
    <div className="read-only-view">
      <ReadOnlyResourceLink
        value={value}
        resourceSelectFieldProps={resourceSelectFieldProps}
      />
    </div>
  );

  return (
    <FieldWrapper
      {...resourceSelectFieldProps}
      readOnlyRender={readOnlyRender ?? defaultReadOnlyRender}
    >
      {({ setValue, value, invalid, placeholder }) => {
        function onChangeInternal(resource) {
          setValue(resource);
          onChange?.(resource);
        }

        return (
          <div className={invalid ? "is-invalid" : ""}>
            <ResourceSelect
              {...resourceSelectProps}
              invalid={invalid}
              onChange={onChangeInternal}
              value={value}
              placeholder={placeholder}
            />
          </div>
        );
      }}
    </FieldWrapper>
  );
}

export interface ReadOnlyResourceLinkProps<TData extends KitsuResource> {
  value?: SingleOrArray<PersistedResource<TData> | null>;
  resourceSelectFieldProps: ResourceSelectFieldProps<TData>;
}

/** Shows a link to the resource. Tries to fetch the resource if theres only a shallow reference. */
export function ReadOnlyResourceLink<TData extends KitsuResource>({
  value,
  resourceSelectFieldProps: { readOnlyLink, model, optionLabel }
}: ReadOnlyResourceLinkProps<TData>) {
  const values = compact(castArray(value));
  const valueIsShallowReference = isShallowReference(values);
  const resources =
    useBulkGet<TData>({
      ids: values.map((it) => it.id),
      listPath: model,
      disabled: !valueIsShallowReference
    }).data ?? values;

  return (
    <Fragment>
      {resources.map((resource, index) => {
        const valueText = resource
          ? optionLabel(resource as any) ?? resource.id
          : "";
        return (
          <Fragment key={resource?.id ?? index}>
            {readOnlyLink && resource ? (
              <Link href={readOnlyLink + resource.id}>{valueText ?? ""}</Link>
            ) : (
              valueText
            )}
            {index === resources.length - 1 ? "" : ", "}
          </Fragment>
        );
      })}
    </Fragment>
  );
}
