import { useLocalStorage } from "@rehooks/local-storage";
import { KitsuResource } from "kitsu";
import { useMemo, useState } from "react";
import { JsonTree } from "@react-awesome-query-builder/ui";
import Select from "react-select";
import { FieldSet, QueryPage, QueryPageProps } from "..";
import { DINAUI_MESSAGES_ENGLISH } from "../../../dina-ui/intl/dina-ui-en";
import { DinaMessage, useDinaIntl } from "../../../dina-ui/intl/dina-ui-intl";
import { CustomViewField } from "../list-page/query-builder/useQueryBuilderConfig";

export interface CustomQueryOption {
  /**
   * Value to be saved when selecting the option.
   */
  readonly value: string;

  /**
   * DINA Label Key to display. Uses the <DinaMessage> component.
   */
  readonly labelKey: keyof typeof DINAUI_MESSAGES_ENGLISH;

  /**
   * Direct label to display in the dropdown. The `labelKey` prop should be used instead to support
   * localization.
   */
  readonly label?: string;

  /**
   * Custom query builder tree to be applied to the QueryPage if this option is selected.
   */
  readonly customQuery?: JsonTree;

  /**
   * Instead of a query builder tree, you can also just do custom elastic search queries.
   *
   * Pagination, sorting and source fields are applied as normal.
   */
  readonly customElasticSearch?: any;

  /**
   * Fields to include in the _source section of the query. Since we will only require certain
   * fields to display not the whole elastic search document.
   */
  readonly customViewFields?: CustomViewField[];
}

export interface CustomQueryPageViewProps<TData extends KitsuResource>
  extends QueryPageProps<TData> {
  /**
   * Legend title to be displayed in the card view. Does not need to be provided if
   * customQueryOptions are provided. The title will be the label of the selected customQueryOption
   * selected.
   */
  titleKey?: keyof typeof DINAUI_MESSAGES_ENGLISH;

  removePadding?: boolean;

  /**
   * If options are provided, a dropdown menu to the right of the legend title will be displayed
   * to allow the user to choose the query thats being displayed.
   *
   * This will overwrite the QueryPageProps customViewQuery.
   */
  customQueryOptions?: CustomQueryOption[];
}

export function CustomQueryPageView<TData extends KitsuResource>({
  titleKey,
  customQueryOptions,
  removePadding,
  ...queryPageProps
}: CustomQueryPageViewProps<TData>) {
  const CUSTOM_QUERY_PAGE_LOCAL_STORAGE_KEY = queryPageProps.uniqueName
    ? queryPageProps.uniqueName + "-custom-query-page-option"
    : null;

  const { formatMessage, locale } = useDinaIntl();

  // Generate the labels based on the locale and options provided.
  const translatedOptions: CustomQueryOption[] | undefined = useMemo(() => {
    if (customQueryOptions) {
      return customQueryOptions.map((option) => ({
        ...option,
        label: formatMessage(option.labelKey)
      }));
    } else {
      return undefined;
    }
  }, [customQueryOptions, locale]);

  // Initialize the `customQuerySelected` state to the first option in the `customQueryOptions`
  // array, if it exists and has at least one element. Otherwise, set it to `null`.
  let customQuerySelectedValue;
  let setCustomQuerySelectedValue;
  if (
    translatedOptions &&
    translatedOptions.length !== 0 &&
    CUSTOM_QUERY_PAGE_LOCAL_STORAGE_KEY
  ) {
    [customQuerySelectedValue, setCustomQuerySelectedValue] =
      useLocalStorage<string>(
        CUSTOM_QUERY_PAGE_LOCAL_STORAGE_KEY,
        translatedOptions[0].value
      );
  } else {
    [customQuerySelectedValue, setCustomQuerySelectedValue] = useState<
      string | null
    >(null);
  }

  const customQuerySelected = useMemo(
    () =>
      translatedOptions?.find(
        (option) => option.value === customQuerySelectedValue
      ),
    [customQuerySelectedValue, locale]
  );

  // The legend is based if customQueryOptions are provided as a prop or just a title key.
  const legend = customQuerySelected?.labelKey ? (
    <DinaMessage id={customQuerySelected.labelKey} />
  ) : titleKey ? (
    <DinaMessage id={titleKey} />
  ) : (
    <></>
  );

  return (
    <FieldSet
      legend={legend}
      removePadding={removePadding}
      wrapLegend={(innerLegend) => (
        <div className="row">
          {customQueryOptions ? (
            <>
              <div className="col-sm-8">{innerLegend}</div>
              <div className="col-sm-4">
                <label style={{ width: "100%" }}>
                  <Select<CustomQueryOption>
                    className="mt-2"
                    name="customQueryOptions"
                    options={translatedOptions}
                    value={customQuerySelected}
                    onChange={(selectedOption) =>
                      setCustomQuerySelectedValue(selectedOption?.value ?? null)
                    }
                  />
                </label>
              </div>
            </>
          ) : (
            <>{innerLegend}</>
          )}
        </div>
      )}
    >
      {customQuerySelected ? (
        <>
          <QueryPage<TData>
            enableColumnSelector={false}
            {...queryPageProps}
            customViewQuery={customQuerySelected.customQuery}
            customViewFields={customQuerySelected.customViewFields ?? []}
            customViewElasticSearchQuery={
              customQuerySelected.customElasticSearch
            }
            viewMode={true}
          />
        </>
      ) : (
        <>
          <QueryPage<TData>
            viewMode={true}
            enableColumnSelector={false}
            {...queryPageProps}
          />
        </>
      )}
    </FieldSet>
  );
}
