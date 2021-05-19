import { useIntl } from "react-intl";
import titleCase from "title-case";
import { Tooltip } from "../tooltip/Tooltip";

export interface FieldNameProps {
  name: string;

  /** Override the default "name" prop used to get labels and tooltips from the intl messages. */
  customName?: string;
}

/** Get the field label and tooltip given the camelCase field key. */
export function useFieldLabels() {
  const { formatMessage, messages } = useIntl();

  function getFieldLabel(name: string) {
    const messageKey = `field_${name}`;
    const tooltipKey = `${messageKey}_tooltip`;
    const tooltip = messages[tooltipKey] ? <Tooltip id={tooltipKey} /> : null;

    const fieldLabel = messages[messageKey]
      ? formatMessage({ id: messageKey as any })
      : titleCase(name);

    return { tooltip, fieldLabel };
  }

  return { getFieldLabel };
}

/**
 * Field header with field name and optional tooltip.
 * The tooltip is found from the intl messages file using the key "field_{fieldName}_tooltip".
 * e.g. field_acMetadataCreator.displayName_tooltip
 */
export function FieldHeader({ name, customName }: FieldNameProps) {
  const { getFieldLabel } = useFieldLabels();
  const { fieldLabel, tooltip } = getFieldLabel(customName ?? name);

  return (
    <div className={`${customName ?? name}-field-header`}>
      {fieldLabel}
      {tooltip}
    </div>
  );
}
