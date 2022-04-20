import {
  ButtonBar,
  BackButton,
  SelectField,
  DinaForm,
  TextField,
  FieldSet,
  SubmitButton,
} from "packages/common-ui/lib";
import { DINAUI_MESSAGES_ENGLISH } from "packages/dina-ui/intl/dina-ui-en";
import { DinaMessage, useDinaIntl } from "packages/dina-ui/intl/dina-ui-intl";
import React from "react";
import { ReactNode, useState } from "react";
import { useApiClient } from "../../../../common-ui/lib/api-client/ApiClientContext";

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
      catalogNumber: "coll.mfn-berlin.de/u/ZMB_Phasm_D001",
      rejuv_date: "1998-05-19",
      host: "hostData",
      rootstock: "rootstockData",
      location: "locationData",
      variety: "varietyData",
    },
  ];

  const { apiClient } = useApiClient();

    /**
   * Asynchronous POST request to reports_labels_api. Used to retrieve PDF
   *
   * @param data material sample data for reports_labels_api
   * @param template twig template selected by user
   */
  async function generateLabel(data, template) {
    // axios post request
    const resp = await apiClient.axios.post(
      `/reports-labels-api/?template=AAFC_Zebra_ZT410.twig&format=pdf`,
      data
    );
    
    // POST request using fetch with async/await
    // const requestOptions = {
    //   method: "POST",
    //   headers: { "Content-Type": "application/json" },
    //   body: data,
    // };
    // const response = await fetch(
    //   "http://localhost:7981/labels/v1.0/?template=AAFC_Zebra_ZT410.twig&format=pdf",
    //   requestOptions
    // );
    // const resp = await response.json();
  }

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
        <div className="row gap-2 align-items-end">
          <SelectField
            className="col-md-4"
            name="template"
            options={ATTRIBUTE_TYPE_OPTIONS}
            onChange={(selectValue: TemplateType) => setTemplate(selectValue)}
          />
          {template && (
            <button
              type="button"
              className="btn btn-primary mb-3 "
              style={{ width: "10rem" }}
              onClick={() => generateLabel(data, template)}
            >
              <DinaMessage id="generateLabel" />
            </button>
            // <SubmitButton className="mb-3"><DinaMessage id="generateLabel"/></SubmitButton>
          )}
        </div>
      </DinaForm>
    </FieldSet>
  );
}

export default GenerateLabelSection;
