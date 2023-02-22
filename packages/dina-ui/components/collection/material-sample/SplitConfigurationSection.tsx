import { FieldSet } from "common-ui";
import { DinaMessage } from "../../../intl/dina-ui-intl";
import { SPLIT_CONFIGURATION_COMPONENT_NAME } from "../../../types/collection-api";

export interface SplitConfigurationSectionProps {
  id?: string;
}

export function SplitConfigurationSection({
  id
}: SplitConfigurationSectionProps) {
  return (
    <FieldSet
      id={id}
      legend={<DinaMessage id="materialSampleSplitConfiguration" />}
      componentName={SPLIT_CONFIGURATION_COMPONENT_NAME}
    />
  );
}
