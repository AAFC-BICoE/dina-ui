import { DinaMessage, useDinaIntl } from "../../../intl/dina-ui-intl";
import Dropdown from "react-bootstrap/Dropdown";
import Button from "react-bootstrap/Button";
import React, { useState } from "react";
import { PersistedResource } from "kitsu";
import { MaterialSample } from "../../../../dina-ui/types/collection-api";
import { ReportTemplate } from "../../../../dina-ui/types/report-label-api";
import Select from "react-select";
import { useAccount, useQuery } from "../../../../common-ui/lib";
import { useApiClient } from "../../../../common-ui/lib/api-client/ApiClientContext";

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
  const [generatingReport, setGeneratingReport] = useState<boolean>(false);
  const { groupNames } = useAccount();
  const { apiClient } = useApiClient();
  useQuery<ReportTemplate[]>(
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

  /**
   * Asynchronous POST request to reports_labels_api. Used to retrieve PDF
   */
  async function generateLabel() {
    if (!reportTemplate) {
      return;
    }
    setGeneratingReport(true);
    const payloadHeaders = Object.keys(materialSample);
    const payloadData = Object.values(materialSample).map((value) => {
      if (value === null || value === undefined) {
        return "";
      }
      const stringify =
        typeof value !== "string" ? `"${JSON.stringify(value)}"` : value;
      const ret = stringify.replace(/,/g, ";");
      return ret;
    });

    const postData = {
      data: {
        type: "report-request",
        attributes: {
          group: groupNames?.[0],
          reportTemplateUUID: reportTemplate.value,
          payload: {
            headers: payloadHeaders,
            data: [payloadData]
          }
        }
      }
    };

    try {
      const reportTemplatePostResponse = await apiClient.axios.post(
        "report-label-api/report-request",
        postData,
        {
          headers: {
            "Content-Type": "application/vnd.api+json"
          }
        }
      );
      const reportRequestGetResponse = await apiClient.axios.get(
        `report-label-api/file/${reportTemplatePostResponse?.data?.data?.id}`,
        { responseType: "blob" }
      );
      const url = window?.URL.createObjectURL(reportRequestGetResponse?.data);
      const link = document?.createElement("a");
      link.href = url;
      const filePath = reportRequestGetResponse?.config?.url;
      const fileName = !filePath
        ? "report.csv"
        : filePath.substring(filePath.lastIndexOf("/") + 1);
      link?.setAttribute("download", fileName); // or any other extension
      document?.body?.appendChild(link);
      link?.click();
      window?.URL?.revokeObjectURL(url);
      setGeneratingReport(false);
    } catch (error) {
      setGeneratingReport(false);
      return error;
    }
  }

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
            onClick={generateLabel}
            className="mt-3"
            disabled={reportTemplate === undefined || generatingReport}
          >
            {generatingReport ? (
              "Generating Report..."
            ) : (
              <DinaMessage id="generateLabel" />
            )}
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
