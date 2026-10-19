import { ControlledVocabularyItem } from "@dina-ui/types/collection-api";
import {
  DinaForm,
  DinaFormContext,
  FieldView,
  INLINE_LABEL_WIDTH,
  LoadingSpinner
} from "common-ui";
import { useContext } from "react";
import {
  getManagedAttributeTitle,
  getManagedAttributeTooltipText
} from "../managed-attributes/ManagedAttributeField";
import { useDinaIntl } from "@dina-ui/intl/dina-ui-intl";
import { useBulkManagedAttributes } from "../managed-attributes/useBulkManagedAttributes";

export interface ControlledVocabularyViewerProps {
  /**
   * Map of Controlled Vocabulary Managed Attributes values.
   *
   * Map key is the controlled vocabulary key.
   * Map value is the controlled vocabulary value.
   */
  values?: Record<string, string | null | undefined> | null;

  /**
   * The base-api the controlled vocabulary items are from.
   *
   * e.g: collection-api
   */
  baseApi: string;

  /**
   * The dina-component to filter against if applicable.
   *
   * e.g: MATERIAL-SAMPLE
   */
  dinaComponent?: string;

  /**
   * The controlled vocabulary uuid to filter against. This component is commonly used to display
   * managed attributes so it would be that UUID in that case.
   */
  controlledVocabularyUUID: string;
}

export function ControlledVocabularyViewer({
  values,
  baseApi,
  dinaComponent,
  controlledVocabularyUUID
}: ControlledVocabularyViewerProps) {
  const { locale, formatMessage } = useDinaIntl();
  // The nested DinaForm resets the context, so carry over the inline layout of the surrounding section:
  const compact = useContext(DinaFormContext)?.compact;

  const keys = values ? Object.keys(values) : [];

  // Use the custom hook to perform the bulk query and fetch controlled vocabulary items
  const { data, loading } = useBulkManagedAttributes({
    baseApiPath: baseApi,
    dinaComponent,
    keys,
    isControlledVocabulary: true,
    controlledVocabularyId: controlledVocabularyUUID,
    disabled: !keys.length
  });

  if (loading) {
    return <LoadingSpinner loading={true} />;
  }

  // Process and enrich fetched items with labels, values, and useful tooltips
  const processedItems = (data as ControlledVocabularyItem[] | undefined)?.map(
    (item) => {
      const label = getManagedAttributeTitle(item as any, locale);
      const rawTooltipText = getManagedAttributeTooltipText(
        item as any,
        locale,
        formatMessage
      );

      const val = values?.[item.key];
      const isUseful =
        Boolean(rawTooltipText?.trim()) &&
        rawTooltipText?.trim().toLowerCase() !== label?.trim().toLowerCase() &&
        rawTooltipText?.trim().toLowerCase() !== val?.trim().toLowerCase();

      return {
        ...item,
        label,
        value: val,
        tooltipText: isUseful ? rawTooltipText : undefined
      };
    }
  );

  // Sort items alphabetically by their resolved label
  const sortedEntries = (processedItems ?? []).sort((a, b) =>
    a.label.localeCompare(b.label, locale, { sensitivity: "base" })
  );

  // Map values for Formik / DinaForm binding
  const initialValues = sortedEntries.reduce(
    (acc, item) => ({ ...acc, [item.key]: item.value }),
    {}
  );

  return (
    <DinaForm
      initialValues={initialValues}
      horizontal={compact && INLINE_LABEL_WIDTH}
      compact={compact}
    >
      <div className={compact ? "row" : "row g-3"}>
        {sortedEntries.map((item) => (
          <FieldView
            key={item.key}
            className={compact ? "col-12" : "col-12 col-md-6"}
            name={item.key}
            customName={item.label}
            tooltipOverride={item.tooltipText}
            startCaseLabel={false}
          />
        ))}
      </div>
    </DinaForm>
  );
}
