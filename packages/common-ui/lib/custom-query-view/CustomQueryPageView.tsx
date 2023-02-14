import { KitsuResource } from "kitsu";
import { DinaMessage } from "../../../dina-ui/intl/dina-ui-intl";
import { FieldSet, QueryPage, QueryPageProps } from "..";
import { DINAUI_MESSAGES_ENGLISH } from "../../../dina-ui/intl/dina-ui-en";
import Select from "react-select";
import { JsonTree } from "react-awesome-query-builder";
import { useState } from "react";

export interface CustomQueryOption {
  /**
   * Value to be saved when selecting the option.
   */
  readonly value: string;

  /**
   * DINA Label Key to display. Uses the <DinaMessage> component.
   */
  readonly label: keyof typeof DINAUI_MESSAGES_ENGLISH;

  /**
   * Custom query to be applied to the QueryPage if this option is selected.
   */
  readonly customQuery: JsonTree;

  /**
   * Fields to include in the _source section of the query. Since we will only require certain
   * fields to display not the whole elastic search document.
   */
  readonly customViewFields: string[];
}

export interface CustomQueryPageViewProps<TData extends KitsuResource>
  extends QueryPageProps<TData> {
  /**
   * Legend title to be displayed in the card view. Does not need to be provided if
   * customQueryOptions are provided. The title will be the label of the selected customQueryOption
   * selected.
   */
  titleKey?: keyof typeof DINAUI_MESSAGES_ENGLISH;

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
  ...queryPageProps
}: CustomQueryPageViewProps<TData>) {
  const [customQuerySelected, setCustomQuerySelected] =
    useState<CustomQueryOption | null>(null);

  // The legend is based if customQueryOptions are provided as a prop or just a title key.
  const legend = customQuerySelected?.label ? (
    <DinaMessage id={customQuerySelected.label} />
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
                <Select<CustomQueryOption>
                  className="mt-2"
                  name="customQueryOptions"
                  options={customQueryOptions}
                  value={customQuerySelected}
                  onChange={(selectedOption) =>
                    setCustomQuerySelected(selectedOption)
                  }
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
            customViewFields={customQuerySelected.customViewFields}
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
