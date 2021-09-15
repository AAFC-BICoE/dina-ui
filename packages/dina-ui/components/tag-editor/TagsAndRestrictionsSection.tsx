import { DinaFormSection, FieldWrapper, FieldWrapperProps } from "common-ui";
import CreatableSelect from "react-select/creatable";
import { useDinaIntl } from "../../intl/dina-ui-intl";

// export interface TagFieldProps extends FieldWrapperProps {}

export function TagsAndRestrictionsSection() {
  return (
    <div className="row">
      <div className="col-6">
        <DinaFormSection horizontal="flex">
          <TagSelectField name="tags" />
        </DinaFormSection>
      </div>
    </div>
  );
}

export interface TagSelectOption {
  label: string;
  value: string;
}

export function TagSelectField(props: FieldWrapperProps) {
  const { formatMessage } = useDinaIntl();

  function toOption(value: string): TagSelectOption {
    return { label: value, value };
  }

  return (
    <FieldWrapper {...props}>
      {({ value, setValue }) => {
        const selectedOptions = (value ?? []).map(toOption);

        function setAsStringArray(selected: TagSelectOption[]) {
          setValue(selected.map(option => option.value));
        }

        return (
          <CreatableSelect<TagSelectOption, true>
            isMulti={true}
            isClearable={true}
            options={[]}
            value={selectedOptions}
            onChange={setAsStringArray}
            placeholder={formatMessage("selectOrType")}
            formatCreateLabel={inputValue =>
              `${formatMessage("add")} "${inputValue}"`
            }
          />
        );
      }}
    </FieldWrapper>
  );
}
