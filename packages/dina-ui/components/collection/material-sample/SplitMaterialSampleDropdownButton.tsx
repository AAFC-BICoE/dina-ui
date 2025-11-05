import { DinaMessage } from "../../../intl/dina-ui-intl";
import { useRouter } from "next/router";
import { writeStorage } from "@rehooks/local-storage";
import {
  BULK_SPLIT_IDS,
  SimpleSearchFilterBuilder,
  Tooltip,
  useAccount,
  useQuery
} from "common-ui";
import Dropdown from "react-bootstrap/Dropdown";
import Select from "react-select";
import React, { CSSProperties, useState } from "react";
import Button from "react-bootstrap/Button";
import { SplitConfiguration } from "../../../types/collection-api/resources/SplitConfiguration";
import { TbArrowsSplit2 } from "react-icons/tb";

export interface SplitConfigurationOption {
  label: string;
  value: string;
  resource: SplitConfiguration;
}

type CustomMenuProps = {
  children?: React.ReactNode;
  style?: React.CSSProperties;
  className?: string;
  labelledBy?: string;
};

interface SplitMaterialSampleDropdownButtonProps {
  ids: string[];
  disabled: boolean;
  materialSampleType?: string;
  className?: string;
  style?: CSSProperties;
}

export function SplitMaterialSampleDropdownButton({
  ids,
  disabled,
  materialSampleType,
  className,
  style
}: SplitMaterialSampleDropdownButtonProps) {
  const router = useRouter();
  const { groupNames, username } = useAccount();

  // List of all the split configurations available.
  const [splitConfigurationOptions, setSplitConfigurationOptions] = useState<
    SplitConfigurationOption[]
  >([]);

  // Selected split configuration to use.
  const [splitConfigurationOption, setSplitConfigurationOption] = useState<
    SplitConfigurationOption | undefined
  >();

  // Retrieve all of the form templates, then filter for the correct one.
  useQuery<SplitConfiguration[]>(
    {
      path: "collection-api/split-configuration",
      page: {
        limit: 1000
      },
      // Display all user form templates and public to the group templates.
      filter: SimpleSearchFilterBuilder.create<SplitConfiguration>()
        .whereIn("group", groupNames)
        .where("createdBy", "EQ", username)
        .build()
    },
    {
      disabled,
      onSuccess: async ({ data }) => {
        // Generate the list of options, filter the ones for this specific material sample type condition.
        const generatedOptions = data
          .filter((splitConfig) =>
            splitConfig.conditionalOnMaterialSampleTypes?.includes(
              materialSampleType ?? ""
            )
          )
          .map((splitConfig) => ({
            label: splitConfig?.name ?? "",
            value: splitConfig?.id ?? "",
            resource: splitConfig
          }));

        setSplitConfigurationOptions(generatedOptions);

        // If options are available, just set the first one automatically.
        if (generatedOptions.length > 0) {
          setSplitConfigurationOption(generatedOptions[0]);
        }
      }
    }
  );

  /**
   * Split submit button clicked.
   */
  async function onClick() {
    // Ensure a split configuration option has been selected.
    if (!splitConfigurationOption || splitConfigurationOption.value === "") {
      return;
    }

    // Save the ids to local storage for the split page to read.
    writeStorage<string[]>(BULK_SPLIT_IDS, ids);

    await router.push(
      `/collection/material-sample/bulk-split?splitConfiguration=${splitConfigurationOption.value}`
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
          aria-labelledby={props.labelledBy}
        >
          <strong>
            <DinaMessage id="selectSplitConfiguration" />
          </strong>
          <Select<SplitConfigurationOption>
            className="mt-2"
            name="splitConfiguration"
            options={splitConfigurationOptions}
            onChange={(selection) =>
              selection && setSplitConfigurationOption(selection)
            }
            autoFocus={true}
            value={splitConfigurationOption}
            isClearable={true}
          />
          <Button
            onClick={onClick}
            className="mt-3"
            disabled={splitConfigurationOption === undefined}
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
        <button
          className={"btn btn-primary " + (className ? className : "me-2")}
          disabled={true}
        >
          <TbArrowsSplit2 className="me-2" />
          <DinaMessage id="splitButton" />
        </button>
      }
    />
  ) : (
    <Dropdown>
      <Dropdown.Toggle className={className ? className : "me-2"} style={style}>
        <TbArrowsSplit2 className="me-2" />
        <DinaMessage id="splitButton" />
      </Dropdown.Toggle>
      <Dropdown.Menu as={CustomMenu} />
    </Dropdown>
  );
}
