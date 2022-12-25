import { SequencingFacilityContact } from "../../../types/seqdb-api";
import { useState } from "react";
import { SeqdbMessage, useSeqdbIntl } from "../../../intl/seqdb-intl";
import { EditableTableColumnDefinition, EditableTable } from "common-ui";
import { Card } from "react-bootstrap";
import { split } from "lodash";

export interface SequencingFacilityContactsProp {
  contacts: SequencingFacilityContact[];
  readonly?: boolean;
}

const CONTACT_COLUMNS: EditableTableColumnDefinition<SequencingFacilityContact>[] =
  [
    {
      accessor: "name",
      Header: () => <SeqdbMessage id="field_name" />
    },
    {
      accessor: "roles",
      Header: () => <SeqdbMessage id="field_role" />,
      formatter: (roles) => (roles || []).join(", "),
      parser: (value) => split(value, ", ")
    },
    {
      accessor: "info",
      Header: () => <SeqdbMessage id="field_contactInfo" />
    }
  ];

export const SequencingFacilityContacts = ({
  contacts: initialContacts,
  readonly = false
}: SequencingFacilityContactsProp) => {
  const [contacts, setContacts] = useState(initialContacts || []);
  const { formatMessage } = useSeqdbIntl();

  return (
    <Card>
      <Card.Header>
        <SeqdbMessage id="sequencingFacilityContacts" />
      </Card.Header>
      <Card.Body>
        <EditableTable<SequencingFacilityContact>
          columns={CONTACT_COLUMNS}
          data={contacts}
          setData={setContacts}
          readonly={readonly}
        />
      </Card.Body>
    </Card>
  );
};
