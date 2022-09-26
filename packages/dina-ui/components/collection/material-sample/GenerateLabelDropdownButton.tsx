import { DinaMessage, useDinaIntl } from "../../../intl/dina-ui-intl";
import Dropdown from "react-bootstrap/Dropdown";
import Button from "react-bootstrap/Button";
import React, { useState } from "react";
import { useApiClient } from "../../../../common-ui/lib/api-client/ApiClientContext";
import { DINAUI_MESSAGES_ENGLISH } from "../../../../dina-ui/intl/dina-ui-en";
import { PersistedResource } from "kitsu";
import { MaterialSample } from "packages/dina-ui/types/collection-api";
import Select from "react-select";

type TemplateType = "AAFC_Beaver_ZT410.twig" | "AAFC_Zebra_ZT410.twig";

interface Template {
  label: keyof typeof DINAUI_MESSAGES_ENGLISH;
  value: TemplateType;
}

const TEMPLATE_TYPE_OPTIONS: Template[] = [
  {
    label: "template_AAFC_Beaver_ZT410",
    value: "AAFC_Beaver_ZT410.twig"
  },
  {
    label: "template_AAFC_Zebra_ZT410",
    value: "AAFC_Zebra_ZT410.twig"
  }
];

type CustomMenuProps = {
  children?: React.ReactNode;
  style?: React.CSSProperties;
  className?: string;
  labeledBy?: string;
};

interface GenerateLabelDropdownButtonProps {
  materialSample: PersistedResource<MaterialSample>;
}

export function GenerateLabelDropdownButton({
  materialSample
}: GenerateLabelDropdownButtonProps) {
  const { apiClient } = useApiClient();
  const { formatMessage } = useDinaIntl();

  const [template, setTemplate] = useState<Template | undefined>();

  // data for POST request
  const data = [materialSample];

  /**
   * Asynchronous POST request to reports_labels_api. Used to retrieve PDF
   *
   * @param data material sample data for reports_labels_api
   * @param template twig template selected by user
   */
  async function generateLabel() {
    if (!template) {
      return;
    }

    // axios post request
    try {
      await apiClient.axios
        .post(
          `/report-label-api/labels/v1.0/?template=${template.value}&format=pdf`,
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

  function toOption(templateSelected: Template) {
    return {
      label: formatMessage(templateSelected.label),
      value: templateSelected
    };
  }

  const dropdownOptionsTranslated = TEMPLATE_TYPE_OPTIONS.map(toOption) ?? [];

  const CustomMenu = React.forwardRef(
    (props: CustomMenuProps, ref: React.Ref<HTMLDivElement>) => {
      return (
        <div
          ref={ref}
          style={{
            ...props.style,
            width: "400px",
            padding: "20px"
          }}
          className={props.className}
          aria-labelledby={props.labeledBy}
        >
          <strong>
            <DinaMessage id="selectTemplate" />
          </strong>
          <Select<{ label: string; value?: Template }>
            className="mt-2"
            name="template"
            options={dropdownOptionsTranslated}
            onChange={(selection) => setTemplate(selection?.value)}
            autoFocus={true}
            value={template && toOption(template)}
            isClearable={true}
          />
          <Button
            onClick={generateLabel}
            className="mt-3"
            disabled={template === undefined}
          >
            <DinaMessage id="generateLabel" />
          </Button>
        </div>
      );
    }
  );

  return (
    <Dropdown>
      <Dropdown.Toggle>
        <DinaMessage id="generateLabel" />
      </Dropdown.Toggle>
      <Dropdown.Menu as={CustomMenu} />
    </Dropdown>
  );
}
