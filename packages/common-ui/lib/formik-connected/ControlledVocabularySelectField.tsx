import { Vocabulary } from "../../../dina-ui/types/collection-api/resources/VocabularyElement";

import classNames from "classnames";
import { find } from "lodash";
import { ReadOnlyValue } from "..";
import { useDinaIntl } from "../../../dina-ui/intl/dina-ui-intl";
import {
  JsonApiQuerySpec,
  useQuery,
  withResponse
} from "../api-client/useQuery";
import { FieldWrapper, FieldWrapperProps } from "./FieldWrapper";
import { SortableSelect } from "./sortable-select/SortableSelect";

export interface ControlledVocabularySelectFieldProp extends FieldWrapperProps {
  query?: () => JsonApiQuerySpec;
  isMulti?: boolean;
  disabled?: boolean;
  isClearable?: boolean;
}

export function ControlledVocabularySelectField(
  controlledVocabularySelectFieldProps: ControlledVocabularySelectFieldProp
) {
  const { locale, formatMessage } = useDinaIntl();
  const {
    query,
    isMulti = false,
    disabled = false,
    isClearable = false
  } = controlledVocabularySelectFieldProps;

  const vocQuery = useQuery<Vocabulary>(query?.() as any);

  return withResponse(vocQuery, ({ data }) => {
    const options = data?.vocabularyElements?.map((el) => ({
      label:
        find(
          el?.multilingualTitle?.titles || [],
          (item) => item.lang === locale
        )?.title ||
        el.name ||
        "",
      value: el.name
    }));

    return (
      <FieldWrapper
        {...controlledVocabularySelectFieldProps}
        readOnlyRender={(value, _form) => {
          const selectedValue = options?.find((opt) => {
            if (Array.isArray(value)) {
              return value.includes(opt.value);
            } else {
              return opt.value === value;
            }
          });
          return (
            <div className="read-only-view">
              <ReadOnlyValue value={selectedValue?.label} />
            </div>
          );
        }}
      >
        {({ setValue, value, invalid }) => {
          function onChange(newValue) {
            if (Array.isArray(newValue)) {
              setValue(newValue.map((v) => v.value));
            } else if (newValue === null) {
              setValue(null);
            } else {
              setValue(newValue.value);
            }
          }

          const selectedValue = options?.filter((opt) => {
            if (Array.isArray(value)) {
              return value.includes(opt.value);
            } else {
              return opt.value === value;
            }
          });

          return (
            <div className={classNames(invalid && "is-invalid")}>
              <SortableSelect
                onChange={onChange}
                options={options}
                placeholder={formatMessage("typeHereToSearch")}
                value={selectedValue}
                isMulti={isMulti}
                isDisabled={disabled}
                isClearable={isClearable}
              />
            </div>
          );
        }}
      </FieldWrapper>
    );
  });
}
