import { DinaMessage } from "../../../intl/dina-ui-intl";
import { useRouter } from "next/router";
import { writeStorage } from "@rehooks/local-storage";
import { BULK_SPLIT_IDS, Tooltip, useAccount, useQuery } from "common-ui";
import Dropdown from "react-bootstrap/Dropdown";
import Select from "react-select";
import React, { useState } from "react";
import Button from "react-bootstrap/Button";
import { FormTemplate } from "../../../types/collection-api";
import { getSplitConfigurationFormTemplates } from "../../form-template/formTemplateUtils";

interface SplitConfigurationOption {
  label: string;
  value: string;
}

type CustomMenuProps = {
  children?: React.ReactNode;
  style?: React.CSSProperties;
  className?: string;
  labeledBy?: string;
};

interface SplitMaterialSampleDropdownButtonProps {
  ids: string[];
  disabled: boolean;
  materialSampleType?: string;
}

export function SplitMaterialSampleDropdownButton({
  ids,
  disabled,
  materialSampleType
}: SplitMaterialSampleDropdownButtonProps) {
  const router = useRouter();
  const { groupNames, username } = useAccount();

  // List of all the split configurations available.
  const [splitConfigurationOptions, setSplitConfigurationOptions] = useState<
    SplitConfigurationOption[]
  >([]);

  // Selected split configuration to use.
  const [splitConfiguration, setSplitConfiguration] = useState<
    SplitConfigurationOption | undefined
  >();

  // Retrieve all of the form templates, then filter for the correct one.
  useQuery<FormTemplate[]>(
    {
      path: "collection-api/form-template",

      // Display all user form templates and public to the group templates.
      filter: {
        rsql: `group=in=(${groupNames});(createdBy==${username},restrictToCreatedBy==false)`
      }
    },
    {
      disabled,
      onSuccess: async ({ data }) => {
        const formTemplatesWithSplitConfig = getSplitConfigurationFormTemplates(
          data as FormTemplate[],
          materialSampleType
        );
        const generatedOptions = formTemplatesWithSplitConfig.map(
          (formTemplate) => ({
            label: formTemplate?.name ?? "",
            value: formTemplate?.id ?? ""
          })
        );
        setSplitConfigurationOptions(generatedOptions);

        // If options are available, just set the first one automatically.
        if (generatedOptions.length > 0) {
          setSplitConfiguration(generatedOptions[0]);
        }
      }
    }
  );

  /**
   * Split submit button clicked.
   */
  async function onClick() {
    // Ensure a split configuration option has been selected.
    if (!splitConfiguration || splitConfiguration.value === "") {
      return;
    }

    // Save the ids to local storage for the split page to read.
    writeStorage<string[]>(BULK_SPLIT_IDS, ids);

    await router.push(
      `/collection/material-sample/bulk-split?splitConfiguration=${splitConfiguration.value}`
    );
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
            <DinaMessage id="selectSplitConfiguration" />
          </strong>
          <Select<SplitConfigurationOption>
            className="mt-2"
            name="splitConfiguration"
            options={splitConfigurationOptions}
            onChange={(selection) =>
              selection && setSplitConfiguration(selection)
            }
            autoFocus={true}
            value={splitConfiguration}
            isClearable={true}
          />
          <Button
            onClick={onClick}
            className="mt-3"
            disabled={splitConfiguration === undefined}
          >
            <DinaMessage id="splitButton" />
          </Button>
        </div>
      );
    }
  );

  return disabled ? (
    <Tooltip
      id="splitMaterialSampleNameRequiredTooltip"
      disableSpanMargin={true}
      visibleElement={
        <button className="btn btn-primary me-2" disabled={true}>
          <DinaMessage id="splitButton" />
        </button>
      }
    />
  ) : (
    <Dropdown>
      <Dropdown.Toggle className="me-2">
        <DinaMessage id="splitButton" />
      </Dropdown.Toggle>
      <Dropdown.Menu as={CustomMenu} />
    </Dropdown>
  );
}
