import { KitsuResource } from "kitsu";
import { DinaMessage } from "../../../dina-ui/intl/dina-ui-intl";
import { FieldSet, QueryPage, QueryPageProps } from "..";
import { DINAUI_MESSAGES_ENGLISH } from "../../../dina-ui/intl/dina-ui-en";
import { useMemo, useState } from "react";
import { useLocalStorage } from "@rehooks/local-storage";
import {
  CustomOptionsDropdown,
  CustomQueryOption
} from "./CustomOptionsDropdown";

export const getCustomQueryPageLocalStorageKey = (
  localStorageKey: string
): string => {
  return `${localStorageKey}-custom-query-page-option`;
};

export interface CustomQueryPageViewProps<TData extends KitsuResource>
  extends QueryPageProps<TData> {
  /**
   * Legend title to be displayed in the card view. Does not need to be provided if
   * customQueryOptions are provided. The title will be the label of the selected customQueryOption
   * selected.
   */
  titleKey?: keyof typeof DINAUI_MESSAGES_ENGLISH;

  /**
   * This key is used for generating the local storage key so the option can be saved in the users
   * local storage.
   *
   * If no key is provided, local storage for saving the option will be disabled.
   */
  localStorageKey?: string;

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
  localStorageKey,
  customQueryOptions,
  ...queryPageProps
}: CustomQueryPageViewProps<TData>) {
  // Initialize the `customQuerySelected` state to the first option in the `customQueryOptions`
  // array, if it exists and has at least one element. Otherwise, set it to `null`.
  let customQuerySelectedValue;
  let setCustomQuerySelectedValue;
  if (localStorageKey) {
    [customQuerySelectedValue, setCustomQuerySelectedValue] = useLocalStorage<
      string | null
    >(
      getCustomQueryPageLocalStorageKey(localStorageKey),
      customQueryOptions?.[0]?.value ?? null
    );
  } else {
    [customQuerySelectedValue, setCustomQuerySelectedValue] = useState<
      string | null
    >(customQueryOptions?.[0]?.value ?? null);
  }

  const customQuerySelected = useMemo(() => {
    return customQueryOptions?.find(
      (option) => option.value === customQuerySelectedValue
    );
  }, [customQuerySelectedValue]);

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
      wrapLegend={(innerLegend) => (
        <div className="row">
          {customQueryOptions ? (
            <>
              <div className="col-sm-8">{innerLegend}</div>
              <div className="col-sm-4">
                <CustomOptionsDropdown
                  customQueryOptions={customQueryOptions}
                  customQuerySelected={customQuerySelectedValue}
                  setCustomQuerySelectedValue={setCustomQuerySelectedValue}
                />
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
          <QueryPage<TData> viewMode={true} {...queryPageProps} />
        </>
      )}
    </FieldSet>
  );
}
