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
    const options = fieldExtension?.extension.fields?.[0]?.acceptedValues?.map(
      val => {
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
      }
    );

    return (
      <FieldWrapper {...fieldExtensionSelectFieldProps}>
        {({ setValue, value }) => {
          function onChange(newValue) {
            setValue(newValue.value);
          }
          const selectedValue = options?.filter(
            opt => opt.value.value === value?.value
          );
          return (
            <SortableSelect
              onChange={onChange}
              options={options}
              placeholder={formatMessage("typeHereToSearch")}
              value={selectedValue}
              axis="xy"
              distance={4}
            />
          );
        }}
      </FieldWrapper>
    );
  });
}

const SortableSelect = SortableContainer(Select);
