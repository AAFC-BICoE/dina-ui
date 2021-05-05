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
  isDisabled?: boolean;
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

        // Fix the place holder text ...Select has not enough contrast ratio to the background issue
        const customStyles = {
          placeholder: (provided, _) => ({
            ...provided,
            color: "rgb(51,51,51)"
          })
        };

        return (
          <ResourceSelect
            {...resourceSelectProps}
            onChange={onChangeInternal}
            value={value}
            styles={customStyles}
          />
        );
      }}
    </FieldWrapper>
  );
}
