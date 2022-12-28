import {
  EditableTable,
  EditableTableColumnDefinition,
  useDinaFormContext
} from "common-ui";
import { useFormikContext } from "formik";
import { compact, split } from "lodash";
import { Card } from "react-bootstrap";
import { SeqdbMessage } from "../../../intl/seqdb-intl";
import {
  SequencingFacilityContactVO,
  SequencingFacilityVO
} from "../../../types/seqdb-api";

const CONTACT_COLUMNS: EditableTableColumnDefinition<SequencingFacilityContactVO>[] =
  [
    {
      accessor: "name",
      Header: () => <SeqdbMessage id="field_name" />
    },
    {
      accessor: "roles",
      Header: () => <SeqdbMessage id="field_role" />,
      formatter: (roles) => (roles || []).join(", "),
      parser: (value) =>
        compact(split(value || "", ",").map((item) => item.trim()))
    },
    {
      accessor: "info",
      Header: () => <SeqdbMessage id="field_contactInfo" />
    }
  ];

export const SequencingFacilityContacts = () => {
  const { readOnly, initialValues } = useDinaFormContext();
  return (
    <Card>
      <Card.Header>
        <SeqdbMessage id="sequencingFacilityContacts" />
      </Card.Header>
      <Card.Body>
        <EditableTable<SequencingFacilityContactVO>
          fieldName="contacts"
          columns={CONTACT_COLUMNS}
          data={initialValues.contacts || []}
          readOnly={readOnly}
        />
      </Card.Body>
    </Card>
  );
};
