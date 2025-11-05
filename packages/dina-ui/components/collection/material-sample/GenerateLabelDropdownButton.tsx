import { DinaMessage } from "../../../intl/dina-ui-intl";
import Dropdown from "react-bootstrap/Dropdown";
import Button from "react-bootstrap/Button";
import React, { useState } from "react";
import { ReportTemplate } from "../../../types/dina-export-api";
import Select from "react-select";
import {
  SimpleSearchFilterBuilder,
  useAccount,
  useQuery,
  downloadBlobFile,
  useApiClient,
  simpleSearchFilterToFiql
} from "common-ui";
import { FaTag } from "react-icons/fa6";

interface ReportTemplateOption {
  label: string;
  value: string;
  includesBarcode?: boolean;
}

export type CustomMenuProps = {
  children?: React.ReactNode;
  style?: React.CSSProperties;
  className?: string;
  labelledBy?: string;
};

interface GenerateLabelDropdownButtonProps {
  resource: any;
}

export function GenerateLabelDropdownButton({
  resource
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
      path: "dina-export-api/report-template",
      fiql: simpleSearchFilterToFiql(
        SimpleSearchFilterBuilder.create<ReportTemplate>()
          .whereIn("group", groupNames)
          .build()
      )
    },
    {
      onSuccess: async ({ data }) => {
        const generatedOptions: ReportTemplateOption[] = data.map(
          (template) => ({
            label: template?.name ?? "",
            value: template?.id ?? "",
            includesBarcode: template.includesBarcode
          })
        );
        setReportTemplateOptions(generatedOptions);

        // If options are available, just set the first one automatically.
        if (generatedOptions.length > 0) {
          setReportTemplate(generatedOptions[0]);
        }
      }
    }
  );

  /**
   * Asynchronous POST request to retrieve PDF
   */
  async function generateLabel() {
    if (!reportTemplate) {
      return;
    }
    setGeneratingReport(true);

    const postPayload = {
      data: {
        type: "report-request",
        attributes: {
          group: groupNames?.[0],
          reportTemplateUUID: reportTemplate.value,
          payload: {
            elements: [
              {
                barcode: {
                  id: resource.barcode ?? "",
                  content: reportTemplate.includesBarcode ? resource.id : ""
                },
                data: {
                  attributes: resource
                }
              }
            ]
          }
        }
      }
    };

    try {
      const reportTemplatePostResponse = await apiClient.axios.post(
        "dina-export-api/report-request",
        postPayload,
        {
          headers: {
            "Content-Type": "application/vnd.api+json"
          }
        }
      );
      const reportRequestGetResponse = await apiClient.axios.get(
        `dina-export-api/file/${reportTemplatePostResponse?.data?.data?.id}`,
        { responseType: "blob" }
      );

      // Generate the file name and file extension.
      const filePath = reportRequestGetResponse?.config?.url;
      const fileName = !filePath
        ? "report"
        : filePath.substring(filePath.lastIndexOf("/") + 1);
      const fullName = `${
        resource.materialSampleName
          ? resource.materialSampleName
          : resource.name
          ? resource.name
          : fileName
      }_${reportTemplate.label}`;

      // Download file
      downloadBlobFile(reportRequestGetResponse?.data, fullName);

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
          aria-labelledby={props.labelledBy}
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
              <DinaMessage id="generatingReport" />
            ) : (
              <DinaMessage id="generateLabel" />
            )}
          </Button>
        </div>
      );
    }
  );

  return (
    <Dropdown aria-label="Generate Label Dropdown">
      <Dropdown.Toggle aria-label="Generate Label Toggle">
        <FaTag className="me-2" />
        <DinaMessage id="generateLabel" />
      </Dropdown.Toggle>
      <Dropdown.Menu
        as={CustomMenu}
        aria-label="Generate Label Dropdown Menu"
      />
    </Dropdown>
  );
}
