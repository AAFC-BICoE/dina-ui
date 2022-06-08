import {
  SelectField,
  DinaForm,
  FieldSet,
  FormikButton
} from "../../../../common-ui/lib";
import { DINAUI_MESSAGES_ENGLISH } from "../../../../dina-ui/intl/dina-ui-en";
import {
  DinaMessage,
  useDinaIntl
} from "../../../../dina-ui/intl/dina-ui-intl";
import React from "react";
import { ReactNode, useState } from "react";
import { useApiClient } from "../../../../common-ui/lib/api-client/ApiClientContext";
import { PersistedResource } from "kitsu";
import { MaterialSample } from "../../../../dina-ui/types/collection-api";

export type TemplateType = "AAFC_Beaver_ZT410.twig" | "AAFC_Zebra_ZT410.twig";

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
  }
];

interface TemplateAttributes<TComponent = string> {
  type: "template-attribute";
  templateComponent: TComponent;
}

type Template<TComponent = string> = TemplateAttributes<TComponent>;
export interface GenerateLabelSectionProps {
  title?: ReactNode;
  materialSample?: PersistedResource<MaterialSample>;
}

export function GenerateLabelSection({
  title,
  materialSample
}: GenerateLabelSectionProps) {
  const { formatMessage } = useDinaIntl();
  const ATTRIBUTE_TYPE_OPTIONS = TEMPLATE_TYPE_OPTIONS.map(
    ({ labelKey, value }) => ({ label: formatMessage(labelKey), value })
  );

  const [template, setTemplate] = useState<TemplateType | null>(null);
  const { apiClient } = useApiClient();

  // data for POST request
  const data = [materialSample];

  /**
   * Asynchronous POST request to reports_labels_api. Used to retrieve PDF
   *
   * @param data material sample data for reports_labels_api
   * @param template twig template selected by user
   */
  async function generateLabel() {
    // axios post request
    await apiClient.axios
      .post(
        `/report-label-api/labels/v1.0/?template=${template}&format=pdf`,
        data,
        { responseType: "blob" }
      )
      .then(response => {
        const url = window.URL.createObjectURL(new Blob([response.data]));
        const link = document.createElement("a");
        link.href = url;
        link.setAttribute(
          "download",
          `${materialSample?.materialSampleName}.pdf`
        ); // or any other extension
        document.body.appendChild(link);
        link.click();
      });
  }

  return (
    <FieldSet legend={<>{title ?? <DinaMessage id="generateLabel" />} </>}>
      <DinaForm<Partial<Template>> initialValues={{}}>
        <div className="row gap-2 align-items-end">
          <SelectField
            className="col-md-4"
            name="template"
            options={ATTRIBUTE_TYPE_OPTIONS}
            onChange={(selectValue: TemplateType) => setTemplate(selectValue)}
          />
          {template && (
            <FormikButton
              className="btn btn-primary col-md-3 mb-3 "
              onClick={async () => await generateLabel()}
            >
              <DinaMessage id="generateLabel" />
            </FormikButton>
          )}
        </div>
      </DinaForm>
    </FieldSet>
  );
}
