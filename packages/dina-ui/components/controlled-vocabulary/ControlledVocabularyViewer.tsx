import { ControlledVocabularyItem } from "@dina-ui/types/collection-api";
import {
  FieldHeader,
  LoadingSpinner,
  ReadOnlyValue,
  SimpleSearchFilterBuilder,
  useApiClient,
  useIsMounted
} from "common-ui";
import { useEffect, useState } from "react";
import {
  getManagedAttributeTitle,
  getManagedAttributeTooltipText
} from "../managed-attributes/ManagedAttributeField";
import { useDinaIntl } from "@dina-ui/intl/dina-ui-intl";

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

interface ControlledVocabularyItemView extends ControlledVocabularyItem {
  // The value to be displayed to the user for the controlled vocabulary.
  value: string | null | undefined;
}

export function ControlledVocabularyViewer({
  values,
  baseApi,
  dinaComponent,
  controlledVocabularyUUID
}: ControlledVocabularyViewerProps) {
  const { locale, formatMessage } = useDinaIntl();
  const { apiClient } = useApiClient();
  const isMounted = useIsMounted();

  /**
   * If awaiting for network requests.
   */
  const [loading, setLoading] = useState<boolean>(true);

  /**
   * Final loaded in structure, this will be used to display the controlled vocabulary to the user.
   */
  const [loadedControlledVocabulary, setLoadedControlledVocabulary] = useState<
    Record<string, ControlledVocabularyItemView>
  >({});

  /**
   * Load each controlled vocabulary item required based on the values given.
   */
  useEffect(() => {
    async function fetchAllControlledVocabularyItems() {
      const keys = values ? Object.keys(values) : [];
      if (!keys.length) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const { data } = await apiClient.get<ControlledVocabularyItem[]>(
          `${baseApi}/controlled-vocabulary-item`,
          {
            filter: SimpleSearchFilterBuilder.create<ControlledVocabularyItem>()
              .whereIn("key", keys)
              .when(!!dinaComponent, (builder) =>
                builder.where("dinaComponent", "EQ", dinaComponent)
              )
              .where(
                "controlledVocabulary.uuid" as any,
                "EQ",
                controlledVocabularyUUID
              )
              .build(),
            page: { limit: keys.length }
          }
        );

        const controlledVocabularyMap: Record<
          string,
          ControlledVocabularyItemView
        > = {};

        data?.forEach((item) => {
          controlledVocabularyMap[item.key] = {
            ...item,
            value: values?.[item.key]
          };
        });

        if (isMounted.current) {
          setLoadedControlledVocabulary(controlledVocabularyMap);
        }
      } catch (error) {
        console.error(error);
      } finally {
        if (isMounted.current) {
          setLoading(false);
        }
      }
    }

    fetchAllControlledVocabularyItems();
  }, [values, baseApi, dinaComponent, controlledVocabularyUUID]);

  if (loading) {
    return <LoadingSpinner loading={true} />;
  }

  const sortedEntries = Object.values(loadedControlledVocabulary ?? {}).sort(
    (a, b) => {
      const titleA = getManagedAttributeTitle(a as any, locale);
      const titleB = getManagedAttributeTitle(b as any, locale);
      return titleA.localeCompare(titleB, locale, { sensitivity: "base" });
    }
  );

  return (
    <div className="row">
      {sortedEntries.map((item) => (
        <ControlledVocabularyField
          key={item.key}
          label={getManagedAttributeTitle(item as any, locale)}
          value={item.value}
          tooltipText={getManagedAttributeTooltipText(
            item as any,
            locale,
            formatMessage
          )}
        />
      ))}
    </div>
  );
}

/**
 * Renders a single controlled vocabulary pair.
 */
function ControlledVocabularyField({
  label,
  value,
  tooltipText
}: {
  label: string;
  value: string | null | undefined;
  tooltipText?: string;
}) {
  // Determine if the tooltip text provides meaningful extra information
  // that isn't identical to the label or value being displayed.
  const isTooltipUseful =
    Boolean(tooltipText?.trim()) &&
    tooltipText?.trim().toLowerCase() !== label?.trim().toLowerCase() &&
    tooltipText?.trim().toLowerCase() !== value?.trim().toLowerCase();

  return (
    <div className="col-6">
      <label className="mb-3 w-100">
        <div className="field-label mb-2">
          <div className="d-flex align-items-center w-100">
            <strong className="me-2">
              <FieldHeader
                name={label}
                tooltipOverride={isTooltipUseful ? tooltipText : undefined}
                startCaseLabel={false}
                combineFieldHeaderWithTooltip={false}
              />
            </strong>
          </div>
        </div>
        <div className="field-col" style={{ cursor: "auto" }}>
          <ReadOnlyValue value={value} />
        </div>
      </label>
    </div>
  );
}
