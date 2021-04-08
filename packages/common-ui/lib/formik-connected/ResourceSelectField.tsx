import { KitsuResource, PersistedResource } from "kitsu";
import {
  ResourceSelect,
  ResourceSelectProps
} from "../resource-select/ResourceSelect";
import { FieldWrapper, LabelWrapperParams } from "./FieldWrapper";

export interface ResourceSelectFieldProps<TData extends KitsuResource>
  extends Omit<ResourceSelectProps<TData>, "value">,
    LabelWrapperParams {
  onChange?: (
    value?: PersistedResource<TData> | PersistedResource<TData>[]
  ) => void;
}

/** Formik-connected Dropdown select input for selecting a resource from the API. */
export function ResourceSelectField<TData extends KitsuResource>(
  resourceSelectFieldProps: ResourceSelectFieldProps<TData>
) {
  const { name, onChange, ...resourceSelectProps } = resourceSelectFieldProps;

  return (
    <FieldWrapper {...resourceSelectFieldProps}>
      {({ setValue, value }) => {
        function onChangeInternal(resource) {
          setValue(resource);
          onChange?.(resource);
        }

        return (
          <ResourceSelect
            {...resourceSelectProps}
            onChange={onChangeInternal}
            value={value}
          />
        );
      }}
    </FieldWrapper>
  );
}
