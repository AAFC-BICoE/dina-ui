import { DinaMessage } from "../../../intl/dina-ui-intl";
import DropdownButton from "react-bootstrap/DropdownButton";
import Dropdown from "react-bootstrap/Dropdown";
import { ReactNode, useState } from "react";
import { useApiClient } from "../../../../common-ui/lib/api-client/ApiClientContext";
import { DINAUI_MESSAGES_ENGLISH } from "../../../../dina-ui/intl/dina-ui-en";
import { PersistedResource } from "kitsu";
import { MaterialSample } from "packages/dina-ui/types/collection-api";

type TemplateType = "AAFC_Beaver_ZT410.twig" | "AAFC_Zebra_ZT410.twig";
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

interface GenerateLabelDropdownButtonProps {
  materialSample: PersistedResource<MaterialSample>;
}

export function GenerateLabelDropdownButton({
  materialSample
}: GenerateLabelDropdownButtonProps) {
  // const [template, setTemplate] = useState<TemplateType | null>(null);
  const { apiClient } = useApiClient();

  // data for POST request
  const data = [materialSample];

  /**
   * Asynchronous POST request to reports_labels_api. Used to retrieve PDF
   *
   * @param data material sample data for reports_labels_api
   * @param template twig template selected by user
   */
  async function generateLabel(template: TemplateType) {
    // axios post request
    try {
      await apiClient.axios
        .post(
          `/report-label-api/labels/v1.0/?template=${template}&format=pdf`,
          data,
          { responseType: "blob" }
        )
        .then((response) => {
          window.open(URL.createObjectURL(response.data)); // open pdf in new tab

          // Download PDF. Keep this for now in case client wants to change behavior
          // const url = window.URL.createObjectURL(new Blob([response.data]));
          // const link = document.createElement("a");
          // link.href = url;
          // link.setAttribute(
          //   "download",
          //   `${materialSample?.materialSampleName}.pdf`
          // ); // or any other extension
          // document.body.appendChild(link);
          // link.click();
        });
    } catch (error) {
      return error;
    }
  }
  return (
    <DropdownButton
      title={<DinaMessage id="generateLabel" />}
      key={"generateLabel"}
    >
      {TEMPLATE_TYPE_OPTIONS.map(({ labelKey, value }) => (
        <Dropdown.Item
          key={labelKey}
          onClick={async () => await generateLabel(value)}
        >
          {labelKey}
        </Dropdown.Item>
      ))}
    </DropdownButton>
  );
}
