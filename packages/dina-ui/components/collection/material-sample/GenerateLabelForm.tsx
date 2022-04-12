import {
  ButtonBar,
  BackButton,
  SelectField,
  DinaForm
} from "packages/common-ui/lib";
import { DINAUI_MESSAGES_ENGLISH } from "packages/dina-ui/intl/dina-ui-en";
import { DinaMessage, useDinaIntl } from "packages/dina-ui/intl/dina-ui-intl";
import React from "react";

export interface GenerateLabelFormProps {}

export type TemplateType =
  | "AAFC_Beaver_ZT410.twig"
  | "AAFC_Zebra_ZT410.twig";

const TEMPLATE_TYPE_OPTIONS: {
  labelKey: keyof typeof DINAUI_MESSAGES_ENGLISH;
  value: TemplateType;
}[] = [
  {
    labelKey: "template_AAFC_Beaver_ZT410",
    value: "AAFC_Beaver_ZT410.twig"
  },
  {
    labelKey: "template_AAFC_Zebra_ZT410",
    value: "AAFC_Zebra_ZT410.twig"
  },
];

interface TemplateAttributes<TComponent = string> {
  type: "template-attribute";
  name: string;
  managedAttributeType: string;
  managedAttributeComponent: TComponent;
  acceptedValues?: string[] | null;
  group?: string;
  createdBy?: string;
  createdOn?: string;
}

type Template<TComponent = string> =
  TemplateAttributes<TComponent>;

function GenerateLabelForm({}: GenerateLabelFormProps) {
  const { formatMessage } = useDinaIntl();
  const ATTRIBUTE_TYPE_OPTIONS = TEMPLATE_TYPE_OPTIONS.map(
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
    <DinaForm<Partial<Template>> initialValues={{}}>
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
