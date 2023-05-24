import { DinaMessage, useDinaIntl } from "../../../intl/dina-ui-intl";
import Dropdown from "react-bootstrap/Dropdown";
import Button from "react-bootstrap/Button";
import React, { useState } from "react";
import { PersistedResource } from "kitsu";
import { MaterialSample } from "packages/dina-ui/types/collection-api";
import { ReportTemplate } from "packages/dina-ui/types/report-label-api";
import Select from "react-select";
import { useAccount, useQuery } from "packages/common-ui/lib";

interface ReportTemplateOption {
  label: string;
  value: string;
}

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
  const [reportTemplate, setReportTemplate] = useState<
    ReportTemplateOption | undefined
  >();
  const [reportTemplateOptions, setReportTemplateOptions] = useState<
    ReportTemplateOption[]
  >([]);
  const { groupNames } = useAccount();
  const resp = useQuery<ReportTemplate[]>(
    {
      path: "report-label-api/report-template",
      filter: {
        rsql: `group=in=(${groupNames})`
      }
    },
    {
      onSuccess: async ({ data }) => {
        const generatedOptions = data.map((template) => ({
          label: template?.name ?? "",
          value: template?.id ?? ""
        }));
        setReportTemplateOptions(generatedOptions);

        // If options are available, just set the first one automatically.
        if (generatedOptions.length > 0) {
          setReportTemplate(generatedOptions[0]);
        }
      }
    }
  );

  // /**
  //  * Asynchronous POST request to reports_labels_api. Used to retrieve PDF
  //  *
  //  * @param data material sample data for reports_labels_api
  //  * @param template twig template selected by user
  //  */
  // async function generateLabel() {
  //   if (!template) {
  //     return;
  //   }

  //   // axios post request
  //   try {
  //     await apiClient.axios
  //       .post(
  //         `/report-label-api/labels/v1.0/?template=${template.value}&format=pdf`,
  //         data,
  //         { responseType: "blob" }
  //       )
  //       .then((response) => {
  //         window.open(URL.createObjectURL(response.data)); // open pdf in new tab

  //         // Download PDF. Keep this for now in case client wants to change behavior
  //         // const url = window.URL.createObjectURL(new Blob([response.data]));
  //         // const link = document.createElement("a");
  //         // link.href = url;
  //         // link.setAttribute(
  //         //   "download",
  //         //   `${materialSample?.materialSampleName}.pdf`
  //         // ); // or any other extension
  //         // document.body.appendChild(link);
  //         // link.click();
  //       });
  //   } catch (error) {
  //     return error;
  //   }
  // }

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
          <Select<ReportTemplateOption>
            className="mt-2"
            name="template"
            options={reportTemplateOptions}
            onChange={(selection) => selection && setReportTemplate(selection)}
            autoFocus={true}
            isClearable={true}
            value={reportTemplate}
          />
          <Button
            // onClick={generateLabel}
            className="mt-3"
            disabled={reportTemplate === undefined}
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
