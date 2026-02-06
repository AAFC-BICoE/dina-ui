import _ from "lodash";
import { useIntl } from "react-intl";
import { Tooltip } from "../tooltip/Tooltip";

export interface FieldNameProps {
  name: string;

  /** Custom text to put at the beginning of the name. Useful for relationship fields. */
  prefixName?: string;

  /** Override the default "name" prop used to get labels and tooltips from the intl messages. */
  customName?: string;

  /** Provide an ID of a tooltip to use, can be changed dynamically. */
  tooltipOverride?: string;

  /** Optional image source to display an image in a tooltip. */
  tooltipImage?: string;

  /** Optional image alt text for image accessability. */
  tooltipImageAlt?: string;

  /** Optional link. */
  tooltipLink?: string;

  /** Optional link text, should be used when adding a link. */
  tooltipLinkText?: string;

  /** Optional flag to make label of the field StartCase. */
  startCaseLabel?: boolean;

  /** Encapsulate the field header with the tooltip, and concatenate the tooltip content with the field header if it is provided. */
  combineFieldHeaderWithTooltip?: boolean;
}

/** Get the field label and tooltip given the camelCase field key. */
export function useFieldLabels() {
  const { formatMessage, messages } = useIntl();

  function getFieldLabel({
    name,
    tooltipOverride,
    tooltipImage,
    tooltipImageAlt,
    tooltipLink,
    tooltipLinkText,
    startCaseLabel = true,
    combineFieldHeaderWithTooltip = true
  }: FieldNameProps) {
    const messageKey = `field_${name}`;
    const tooltipKey = tooltipOverride
      ? tooltipOverride
      : `${messageKey}_tooltip`;

    const fieldLabel = messages[messageKey]
      ? formatMessage({ id: messageKey as any })
      : startCaseLabel
      ? _.startCase(name)
      : name;

    if (combineFieldHeaderWithTooltip) {
      const tooltipText =
        messages[tooltipKey] || tooltipImage || tooltipLink || tooltipOverride
          ? fieldLabel +
            ": " +
            (messages[tooltipKey]
              ? formatMessage({ id: tooltipKey as any })
              : tooltipOverride
              ? tooltipOverride
              : "")
          : fieldLabel;
      const tooltipWithLabel = (
        <Tooltip
          id={undefined}
          directText={tooltipText}
          image={tooltipImage}
          altImage={tooltipImageAlt}
          link={tooltipLink}
          linkText={tooltipLinkText}
          visibleElement={<>{fieldLabel}</>}
        />
      );

      return { tooltip: tooltipWithLabel, fieldLabel };
    }

    const tooltip =
      messages[tooltipKey] || tooltipImage || tooltipLink || tooltipOverride ? (
        <Tooltip
          id={messages[tooltipKey] ? tooltipKey : undefined}
          directText={tooltipOverride}
          image={tooltipImage}
          altImage={tooltipImageAlt}
          link={tooltipLink}
          linkText={tooltipLinkText}
        />
      ) : null;

    return { tooltip, fieldLabel };
  }

  return { getFieldLabel };
}

/**
 * Field header with field name and optional tooltip.
 * The tooltip is found from the intl messages file using the key "field_{fieldName}_tooltip".
 * e.g. field_acMetadataCreator.displayName_tooltip
 */
export function FieldHeader({
  name,
  prefixName,
  customName,
  tooltipOverride,
  tooltipImage,
  tooltipImageAlt,
  tooltipLink,
  tooltipLinkText,
  startCaseLabel,
  combineFieldHeaderWithTooltip
}: FieldNameProps) {
  const { getFieldLabel } = useFieldLabels();
  const { fieldLabel, tooltip } = getFieldLabel({
    name: customName ?? name,
    tooltipOverride,
    tooltipImage,
    tooltipImageAlt,
    tooltipLink,
    tooltipLinkText,
    startCaseLabel,
    combineFieldHeaderWithTooltip
  });

  if (combineFieldHeaderWithTooltip) {
    return <div className={"truncate-text"}>{tooltip}</div>;
  }

  return (
    <div className={`${customName ?? name}-field-header "truncate-text"`}>
      {prefixName ? prefixName + " " : ""}
      {fieldLabel}
      {tooltip}
    </div>
  );
}
