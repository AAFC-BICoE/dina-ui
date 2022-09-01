import {
  FieldExtension,
  ExtensionValue
} from "../../../dina-ui/types/collection-api/resources/FieldExtension";

import { SortableContainer } from "react-sortable-hoc";
import Select from "react-select";
import {
  JsonApiQuerySpec,
  useQuery,
  withResponse
} from "../api-client/useQuery";
import { FieldWrapper, FieldWrapperProps } from "./FieldWrapper";
import { useDinaIntl } from "../../../dina-ui/intl/dina-ui-intl";
import { GoCircleSlash } from "react-icons/go";

export interface FieldExtensionSelectFieldProp extends FieldWrapperProps {
  query?: () => JsonApiQuerySpec;
}

export function FieldExtensionSelectField(
  fieldExtensionSelectFieldProps: FieldExtensionSelectFieldProp
) {
  const { formatMessage } = useDinaIntl();
  const { query } = fieldExtensionSelectFieldProps;

  const fieldExtensionQuery = useQuery<FieldExtension>(query?.() as any);

  return withResponse(fieldExtensionQuery, ({ data: fieldExtension }) => {
    const options = [
      { label: "None", value: null }, // none option to deselect field, concatenated with mapped values
      ...fieldExtension?.extension.fields?.[0]?.acceptedValues?.map((val) => {
        const extensionValue: ExtensionValue = {
          extKey: fieldExtension.extension.key,
          extTerm: fieldExtension.extension.fields?.[0]?.term,
          extVersion: fieldExtension.extension.version
        };
        extensionValue.value = val;
        return {
          label: val,
          value: extensionValue
        };
      })
    ];
    return (
      <FieldWrapper
        {...fieldExtensionSelectFieldProps}
        readOnlyRender={(value) =>
          value ? (
            <div className="card py-1 px-2 flex-row align-items-center gap-1 bg-danger">
              <GoCircleSlash className="text-white" />
              <span className="text-white">
                {fieldExtensionSelectFieldProps.label + " : " + value?.value}
              </span>
            </div>
          ) : null
        }
      >
        {({ setValue, value }) => {
          function onChange(newValue) {
            setValue(newValue.value);
          }

          // Display selected value, display default placeholder if None selected
          const selectedValue = options?.filter((opt) =>
            opt.value ? opt.value.value === value?.value : null
          );

          return (
            <SortableSelect
              onChange={onChange}
              options={options}
              placeholder={formatMessage("typeHereToSearch")}
              value={selectedValue}
              axis="xy"
              distance={4}
              defaultValue={null}
            />
          );
        }}
      </FieldWrapper>
    );
  });
}

const SortableSelect = SortableContainer(Select);
