import { DinaMessage } from "../../../intl/dina-ui-intl";
import { useRouter } from "next/router";
import { writeStorage } from "@rehooks/local-storage";
import { BULK_SPLIT_IDS, Tooltip } from "common-ui/lib";
import Dropdown from "react-bootstrap/Dropdown";
import Select from "react-select";
import React, { useState } from "react";
import Button from "react-bootstrap/Button";

interface SplitConfiguration {
  label: string;
  value: string;
}

const SPLIT_CONFIGURATION_OPTIONS: SplitConfiguration[] = [
  {
    label: "Culture Strain",
    value: "cultureStrain"
  },
  {
    label: "Sample",
    value: "sample"
  }
];

type CustomMenuProps = {
  children?: React.ReactNode;
  style?: React.CSSProperties;
  className?: string;
  labeledBy?: string;
};

interface SplitMaterialSampleDropdownButtonProps {
  ids: string[];
  disabled: boolean;
}

export function SplitMaterialSampleDropdownButton({
  ids,
  disabled
}: SplitMaterialSampleDropdownButtonProps) {
  const router = useRouter();

  const [splitConfiguration, setSplitConfiguration] = useState<
    SplitConfiguration | undefined
  >();

  async function onClick() {
    // Save the ids to local storage for the split page to read.
    writeStorage<string[]>(BULK_SPLIT_IDS, ids);

    await router.push("/collection/material-sample/bulk-split");
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
          <Select<SplitConfiguration>
            className="mt-2"
            name="splitConfiguration"
            options={SPLIT_CONFIGURATION_OPTIONS}
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
