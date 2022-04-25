import {
  ButtonBar,
  BackButton,
  SelectField,
  DinaForm,
  TextField,
  FieldSet,
  SubmitButton,
  FormikButton,
} from "../../../../common-ui/lib";
import { DINAUI_MESSAGES_ENGLISH } from "../../../../dina-ui/intl/dina-ui-en";
import {
  DinaMessage,
  useDinaIntl,
} from "../../../../dina-ui/intl/dina-ui-intl";
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
  templateComponent: TComponent;
}

type Template<TComponent = string> = TemplateAttributes<TComponent>;
export interface GenerateLabelSectionProps {
  title?: ReactNode;
}

export function GenerateLabelSection({ title }: GenerateLabelSectionProps) {
  const { formatMessage } = useDinaIntl();
  const ATTRIBUTE_TYPE_OPTIONS = TEMPLATE_TYPE_OPTIONS.map(
    ({ labelKey, value }) => ({ label: formatMessage(labelKey), value })
  );

  const [template, setTemplate] = useState<TemplateType | null>(null);
  const data = [
    {
      catalogNumber: "http://dina.local/",
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
    await apiClient.axios
      .post(
        `/reports-labels-api/labels/v1.0/?template=${template}&format=pdf`,
        data,
        { responseType: "blob" }
      )
      .then((response) => {
        window.open(URL.createObjectURL(response.data));
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
              onClick={async () => await generateLabel(data, template)}
            >
              <DinaMessage id="generateLabel" />
            </FormikButton>
          )}
        </div>
      </DinaForm>
    </FieldSet>
  );
}
