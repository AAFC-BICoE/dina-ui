import { startCase } from "lodash";
import { useIntl } from "react-intl";
import { Tooltip } from "../tooltip/Tooltip";

export interface FieldNameProps {
  name: string;

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
    tooltipLinkText
  }: FieldNameProps) {
    const messageKey = `field_${name}`;
    const tooltipKey = tooltipOverride
      ? tooltipOverride
      : `${messageKey}_tooltip`;

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

    const fieldLabel = messages[messageKey]
      ? formatMessage({ id: messageKey as any })
      : startCase(name);

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
  customName,
  tooltipOverride,
  tooltipImage,
  tooltipImageAlt,
  tooltipLink,
  tooltipLinkText
}: FieldNameProps) {
  const { getFieldLabel } = useFieldLabels();
  const { fieldLabel, tooltip } = getFieldLabel({
    name: customName ?? name,
    tooltipOverride,
    tooltipImage,
    tooltipImageAlt,
    tooltipLink,
    tooltipLinkText
  });

  return (
    <div className={`${customName ?? name}-field-header`}>
      {fieldLabel}
      {tooltip}
    </div>
  );
}
