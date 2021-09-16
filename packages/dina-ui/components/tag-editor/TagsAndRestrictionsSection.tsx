import {
  DinaFormSection,
  FieldWrapper,
  FieldWrapperProps,
  ToggleField
} from "common-ui";
import { AiFillTag, AiFillTags } from "react-icons/ai";
import CreatableSelect from "react-select/creatable";
import { DinaMessage, useDinaIntl } from "../../intl/dina-ui-intl";

// export interface TagFieldProps extends FieldWrapperProps {}

export function TagsAndRestrictionsSection() {
  return (
    <div className="row">
      <DinaFormSection horizontal="flex">
        <TagSelectField
          className="col-sm-6"
          name="tags"
          label={
            <span>
              <AiFillTags /> <DinaMessage id="tags" />
            </span>
          }
        />
        <ToggleField className="col-sm-6" name="publiclyReleasable" />
      </DinaFormSection>
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
    <FieldWrapper
      {...props}
      readOnlyRender={value => (
        <div className="d-flex flex-wrap gap-2">
          {(value ?? []).map((tag, index) => (
            <div
              key={index}
              className="card p-1 flex-row align-items-center gap-1"
              style={{ background: "rgb(221, 221, 221)" }}
            >
              <AiFillTag />
              <span>{tag}</span>
            </div>
          ))}
        </div>
      )}
    >
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
