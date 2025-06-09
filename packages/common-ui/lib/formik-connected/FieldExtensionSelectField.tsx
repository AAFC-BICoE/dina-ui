import {
  ExtensionValue,
  FieldExtension
} from "../../../dina-ui/types/collection-api/resources/FieldExtension";

import { FaExclamationTriangle } from "react-icons/fa";
import Select from "react-select";
import { Tooltip } from "..";
import { useDinaIntl } from "../../../dina-ui/intl/dina-ui-intl";
import {
  JsonApiQuerySpec,
  useQuery,
  withResponse
} from "../api-client/useQuery";
import { FieldWrapper, FieldWrapperProps } from "./FieldWrapper";

export interface FieldExtensionSelectFieldProp extends FieldWrapperProps {
  query?: () => JsonApiQuerySpec;
  isRestricted?: boolean;
}

export function FieldExtensionSelectField(
  fieldExtensionSelectFieldProps: FieldExtensionSelectFieldProp
) {
  const { formatMessage } = useDinaIntl();
  const { query, isRestricted } = fieldExtensionSelectFieldProps;

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
            <Tooltip
              visibleElement={
                <div
                  className={
                    "card pill py-1 px-2 flex-row align-items-center mb-2 " +
                    (isRestricted ?? false ? "bg-danger" : "bg-warning")
                  }
                >
                  <FaExclamationTriangle
                    className={isRestricted ?? false ? "text-white" : undefined}
                  />
                  <span
                    className={isRestricted ?? false ? "text-white" : undefined}
                  >
                    <strong>
                      {fieldExtensionSelectFieldProps.label + ": "}
                    </strong>
                    {value?.value}
                  </span>
                </div>
              }
              id="field_restriction"
              disableSpanMargin={true}
            />
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
            <Select
              onChange={onChange}
              options={options}
              placeholder={formatMessage("typeHereToSearch")}
              value={selectedValue}
              defaultValue={null}
            />
          );
        }}
      </FieldWrapper>
    );
  });
}
