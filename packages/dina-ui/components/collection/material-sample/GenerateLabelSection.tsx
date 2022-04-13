import {
  ButtonBar,
  BackButton,
  SelectField,
  DinaForm,
  TextField,
  FieldSet,
} from "packages/common-ui/lib";
import { DINAUI_MESSAGES_ENGLISH } from "packages/dina-ui/intl/dina-ui-en";
import { DinaMessage, useDinaIntl } from "packages/dina-ui/intl/dina-ui-intl";
import React from "react";
import { ReactNode, useState } from "react";

export type TemplateType = "AAFC_Beaver_ZT410.twig" | "AAFC_Zebra_ZT410.twig";

const TEMPLATE_TYPE_OPTIONS: {
  labelKey: keyof typeof DINAUI_MESSAGES_ENGLISH;
  value: TemplateType;
}[] = [
  {
    labelKey: "template_AAFC_Beaver_ZT410",
    value: "AAFC_Beaver_ZT410.twig",
  },
  {
    labelKey: "template_AAFC_Zebra_ZT410",
    value: "AAFC_Zebra_ZT410.twig",
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

type Template<TComponent = string> = TemplateAttributes<TComponent>;
export interface GenerateLabelSectionProps {
  title?: ReactNode;
}
function GenerateLabelSection({ title }: GenerateLabelSectionProps) {
  const { formatMessage } = useDinaIntl();
  const ATTRIBUTE_TYPE_OPTIONS = TEMPLATE_TYPE_OPTIONS.map(
    ({ labelKey, value }) => ({ label: formatMessage(labelKey), value })
  );

  const [template, setTemplate] = useState<TemplateType | null>(null);
  const format = "pdf";
  const data = [
    {
      catalogNumber: "http://coll.mfn-berlin.de/u/ZMB_Phasm_D001",
      rejuv_date: "1998-05-19",
      host: "hostData",
      variety: "varietyData",
    },
  ];

  return (
    <FieldSet
      legend={
        <>
          {title ?? <DinaMessage id="generateLabel" />}{" "}
          {/* <TotalAttachmentsIndicator attachmentPath={attachmentPath} /> */}
        </>
      }
    >
      <DinaForm<Partial<Template>> initialValues={{}}>
        <div className="row">
          <SelectField
            className="col-md-4"
            name="template"
            options={ATTRIBUTE_TYPE_OPTIONS}
            onChange={(selectValue: TemplateType) => setTemplate(selectValue)}
          />
          {template && <a className="btn btn-primary col-md-2">
            <DinaMessage id="generateLabel" />
          </a>}
        </div>
      </DinaForm>
    </FieldSet>
  );
}

export default GenerateLabelSection;
