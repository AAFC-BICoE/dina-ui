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
}

export function ControlledVocabularySelectField(
  controlledVocabularySelectFieldProps: ControlledVocabularySelectFieldProp
) {
  const { locale, formatMessage } = useDinaIntl();
  const { query } = controlledVocabularySelectFieldProps;

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
            setValue(newValue.value);
          }
          const selectedValue = options?.filter((opt) => opt.value === value);
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
