import {
  EditableTable,
  EditableTableColumnDefinition,
  useDinaFormContext,
  FieldSet
} from "common-ui";
import { SeqdbMessage } from "../../../intl/seqdb-intl";
import {
  SequencingFacilityContactVO,
  SequencingFacilityVO
} from "../../../types/seqdb-api";

export interface SequencingFacilityProps {
  formValues: SequencingFacilityVO;
}

const CONTACT_COLUMNS: EditableTableColumnDefinition<SequencingFacilityContactVO>[] =
  [
    {
      accessorKey: "name",
      header: () => <SeqdbMessage id="field_name" />
    },
    {
      accessorKey: "roles",
      header: () => <SeqdbMessage id="field_role" />
    },
    {
      accessorKey: "info",
      header: () => <SeqdbMessage id="field_contactInfo" />
    }
  ];

export const SequencingFacilityContacts = ({
  formValues
}: SequencingFacilityProps) => {
  const { readOnly } = useDinaFormContext();
  return (
    <FieldSet legend={<SeqdbMessage id="sequencingFacilityContacts" />}>
      <EditableTable<SequencingFacilityContactVO>
        fieldName="contacts"
        columns={CONTACT_COLUMNS}
        data={formValues.contacts || []}
        readOnly={readOnly}
      />
    </FieldSet>
  );
};
