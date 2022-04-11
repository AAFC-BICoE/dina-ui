import {
  ButtonBar,
  BackButton,
  SelectField,
  DinaForm
} from "packages/common-ui/lib";
import { DINAUI_MESSAGES_ENGLISH } from "packages/dina-ui/intl/dina-ui-en";
import { DinaMessage, useDinaIntl } from "packages/dina-ui/intl/dina-ui-intl";
import { ManagedAttributeType } from "packages/dina-ui/types/objectstore-api";
import React from "react";
import { SubmitButton } from "react-dropzone-uploader";

export interface GenerateLabelFormProps {}

const MANAGED_ATTRIBUTE_TYPE_OPTIONS: {
  labelKey: keyof typeof DINAUI_MESSAGES_ENGLISH;
  value: ManagedAttributeType;
}[] = [
  {
    labelKey: "field_managedAttributeType_integer_label",
    value: "INTEGER"
  },
  {
    labelKey: "field_managedAttributeType_text_label",
    value: "STRING"
  },
  {
    labelKey: "field_managedAttributeType_picklist_label",
    value: "PICKLIST"
  },
  {
    labelKey: "field_managedAttributeType_date_label",
    value: "DATE"
  },
  {
    labelKey: "field_managedAttributeType_boolean_label",
    value: "BOOL"
  }
];

interface ManagedAttributeAttributes<TComponent = string> {
  type: "managed-attribute";
  name: string;
  managedAttributeType: string;
  managedAttributeComponent: TComponent;
  acceptedValues?: string[] | null;
  group?: string;
  createdBy?: string;
  createdOn?: string;
}

type ManagedAttribute<TComponent = string> =
  ManagedAttributeAttributes<TComponent>;

function GenerateLabelForm({}: GenerateLabelFormProps) {
  const { formatMessage } = useDinaIntl();
  const ATTRIBUTE_TYPE_OPTIONS = MANAGED_ATTRIBUTE_TYPE_OPTIONS.map(
    ({ labelKey, value }) => ({ label: formatMessage(labelKey), value })
  );
  const buttonBar = (
    <ButtonBar className="flex">
      <BackButton
        className="me-auto"
        entityLink="/collection/material-sample"
      />
      <a className="btn btn-primary">
        <DinaMessage id="generateLabel" />
      </a>
    </ButtonBar>
  );
  return (
    <DinaForm<Partial<ManagedAttribute>> initialValues={{}}>
      {buttonBar}
      <div className="row">
      <SelectField
        className="col-md-6"
        name="template"
        options={ATTRIBUTE_TYPE_OPTIONS}
        //   onChange={(selectValue: ManagedAttributeType) => setType(selectValue)}
      />
    </div>
      {buttonBar}
    </DinaForm>
  );
}

export default GenerateLabelForm;
