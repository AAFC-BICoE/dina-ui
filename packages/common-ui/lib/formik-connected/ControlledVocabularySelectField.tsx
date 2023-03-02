import { Vocabulary } from "../../../dina-ui/types/collection-api/resources/VocabularyElement";

import { SortableContainer } from "react-sortable-hoc";
import Select from "react-select";
import {
  JsonApiQuerySpec,
  useQuery,
  withResponse
} from "../api-client/useQuery";
import { FieldWrapper, FieldWrapperProps } from "./FieldWrapper";
import { useDinaIntl } from "../../../dina-ui/intl/dina-ui-intl";
import { find } from "lodash";
import classNames from "classnames";

export interface ControlledVocabularySelectFieldProp extends FieldWrapperProps {
  query?: () => JsonApiQuerySpec;
  isMulti?: boolean;
  disabled?: boolean;
}

export function ControlledVocabularySelectField(
  controlledVocabularySelectFieldProps: ControlledVocabularySelectFieldProp
) {
  const { locale, formatMessage } = useDinaIntl();
  const {
    query,
    isMulti = false,
    disabled = false
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
      <FieldWrapper {...controlledVocabularySelectFieldProps}>
        {({ setValue, value, invalid }) => {
          function onChange(newValue) {
            if (Array.isArray(newValue)) {
              setValue(newValue.map((v) => v.value));
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
                axis="xy"
                distance={4}
                isMulti={isMulti}
                isDisabled={disabled}
              />
            </div>
          );
        }}
      </FieldWrapper>
    );
  });
}

const SortableSelect = SortableContainer(Select);
