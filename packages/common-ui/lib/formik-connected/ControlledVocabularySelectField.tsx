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

export interface ControlledVocabularySelectFieldProp extends FieldWrapperProps {
  query?: () => JsonApiQuerySpec;
  isMulti?: boolean;
}

export function ControlledVocabularySelectField(
  controlledVocabularySelectFieldProps: ControlledVocabularySelectFieldProp
) {
  const { locale, formatMessage } = useDinaIntl();
  const { query, isMulti = false } = controlledVocabularySelectFieldProps;

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
        {({ setValue, value }) => {
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
            <SortableSelect
              onChange={onChange}
              options={options}
              placeholder={formatMessage("typeHereToSearch")}
              value={selectedValue}
              axis="xy"
              distance={4}
              isMulti={isMulti}
            />
          );
        }}
      </FieldWrapper>
    );
  });
}

const SortableSelect = SortableContainer(Select);
