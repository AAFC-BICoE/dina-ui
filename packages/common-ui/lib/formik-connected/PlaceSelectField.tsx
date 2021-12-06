import { GroupBase, OptionsOrGroups } from "react-select";
import { FieldWrapper, LabelWrapperParams } from "./FieldWrapper";
import { SingleOrArray } from "./ResourceSelectField";
import { SourceAdministrativeLevel } from "../../../dina-ui/types/collection-api/resources/GeographicPlaceNameSourceDetail";
import { castArray, isArray } from "lodash";
import Select from "react-select";
import { useDinaFormContext } from "./DinaForm";

export interface PlaceSelectFieldProps<T = string> extends LabelWrapperParams {
  onChange?: (value?: SingleOrArray<T>) => void;
  isDisabled?: boolean;

  options?: OptionsOrGroups<any, GroupBase<any>> | undefined;

  isMulti?: boolean;
}

/** Formik-connected Dropdown select input for selecting sections from one search result. */
export function PlaceSelectField<T = string>(
  resourceSelectFieldProps: PlaceSelectFieldProps<T>
) {
  const { onChange, readOnlyRender, isMulti, options, ...resourceSelectProps } =
    resourceSelectFieldProps;

  const { readOnly, initialValues } = useDinaFormContext();

  const defaultReadOnlyRender = (
    value?: SingleOrArray<SourceAdministrativeLevel | null>
  ) => (
    <div className="read-only-view">
      {isArray(value)
        ? value.map(val => (
            <div key={val?.id ?? val?.name} className="mb-1">
              {" "}
              {val?.name ?? val?.id ?? val?.toString()}{" "}
            </div>
          ))
        : value}
    </div>
  );

  return (
    <FieldWrapper
      {...resourceSelectFieldProps}
      readOnlyRender={readOnlyRender ?? defaultReadOnlyRender}
      removeLabel={readOnly || initialValues.id}
    >
      {({ setValue, value, invalid }) => {
        function onChangeInternal(newSelectedRaw) {
          const newSelected = castArray(newSelectedRaw);
          const resources = newSelected
            ? newSelected.map(opt => opt.value)
            : [];
          const newVal = isMulti ? resources : resources[0];
          setValue(newVal);
          onChange?.(newVal);
        }

        function toOption(place: SourceAdministrativeLevel) {
          return { label: place.name, value: place };
        }

        const selectedOptions = (value ? castArray(value) : []).map(toOption);

        return (
          <div className={invalid ? "is-invalid" : ""}>
            <Select
              {...resourceSelectProps}
              onChange={onChangeInternal}
              isMulti={isMulti}
              value={selectedOptions}
              isDisabled={readOnly}
              options={options}
            />
          </div>
        );
      }}
    </FieldWrapper>
  );
}
