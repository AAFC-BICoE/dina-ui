import { useIntl } from "react-intl";
import titleCase from "title-case";
import { Tooltip } from "../tooltip/Tooltip";

export interface FieldNameProps {
  name: string;
  customeName?: string;
}

/**
 * Field header with field name and optional tooltip.
 * The tooltip is found from the intl messages file using the key "field_{fieldName}_tooltip".
 * e.g. field_acMetadataCreator.displayName_tooltip
 */
export function FieldHeader({ name: fieldName, customeName }: FieldNameProps) {
  const { formatMessage, messages } = useIntl();

  const messageKey = customeName
    ? `field_${customeName}`
    : `field_${fieldName}`;

  const tooltipKey = `${messageKey}_tooltip`;
  const tooltip = messages[tooltipKey] ? <Tooltip id={tooltipKey} /> : null;

  return (
    <div className={`${fieldName}-field-header`}>
      {messages[messageKey]
        ? formatMessage({ id: messageKey as any })
        : titleCase(fieldName)}
      {tooltip}
    </div>
  );
}
