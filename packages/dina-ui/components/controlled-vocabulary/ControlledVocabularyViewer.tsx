import { ControlledVocabularyItem } from "@dina-ui/types/collection-api";
import {
  DinaForm,
  FieldView,
  LoadingSpinner,
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
  label: string;
  tooltipText?: string;
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
          const label = getManagedAttributeTitle(item as any, locale);
          const rawTooltipText = getManagedAttributeTooltipText(
            item as any,
            locale,
            formatMessage
          );

          const val = values?.[item.key];
          const isUseful =
            Boolean(rawTooltipText?.trim()) &&
            rawTooltipText?.trim().toLowerCase() !==
              label?.trim().toLowerCase() &&
            rawTooltipText?.trim().toLowerCase() !== val?.trim().toLowerCase();

          controlledVocabularyMap[item.key] = {
            ...item,
            label,
            value: val,
            tooltipText: isUseful ? rawTooltipText : undefined
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
    (a, b) => a.label.localeCompare(b.label, locale, { sensitivity: "base" })
  );

  // Map values for Formik / DinaForm binding
  const initialValues = sortedEntries.reduce(
    (acc, item) => ({ ...acc, [item.key]: item.value }),
    {}
  );

  return (
    <DinaForm initialValues={initialValues}>
      <div className="row g-3">
        {sortedEntries.map((item) => (
          <FieldView
            key={item.key}
            className="col-12 col-md-6"
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
