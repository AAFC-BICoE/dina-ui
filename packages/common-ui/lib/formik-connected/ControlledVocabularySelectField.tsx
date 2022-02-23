import { Vocabulary } from "../../../dina-ui/types/collection-api/resources/VocabularyElement";

import { SortableContainer } from "react-sortable-hoc";
import Select from "react-select";
import { useQuery } from "../api-client/useQuery";
import { FieldWrapper, FieldWrapperProps } from "./FieldWrapper";
import { useDinaIntl } from "../../../dina-ui/intl/dina-ui-intl";

export interface ControlledVocabularySelectFieldProp extends FieldWrapperProps {
  query?: () => any;
}

export function ControlledVocabularySelectField(
  controlledVocabularySelectFieldProps: ControlledVocabularySelectFieldProp
) {
  const { locale, formatMessage } = useDinaIntl();
  const { query } = controlledVocabularySelectFieldProps;

  const { loading, response } = useQuery<Vocabulary>(query?.());
  if (loading) return <></>;

  const options = response?.data?.vocabularyElements?.map(el => ({
    label: el.labels?.[locale],
    value: el.name
  }));

  return (
    <FieldWrapper {...controlledVocabularySelectFieldProps}>
      {({ setValue, value }) => {
        function onChange(newValue) {
          setValue(newValue.value);
        }
        const selectedValue = options?.filter(opt => opt.value === value);
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
}

const SortableSelect = SortableContainer(Select);
