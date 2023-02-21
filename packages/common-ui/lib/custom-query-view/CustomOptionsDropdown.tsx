import { useMemo } from "react";
import { JsonTree } from "react-awesome-query-builder";
import Select from "react-select";
import { CustomViewField } from "../list-page/query-builder/useQueryBuilderConfig";
import { useDinaIntl } from "../../../dina-ui/intl/dina-ui-intl";
import { DINAUI_MESSAGES_ENGLISH } from "packages/dina-ui/intl/dina-ui-en";

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

export interface CustomOptionsDropdownProps {
  /**
   * If options are provided, a dropdown menu to the right of the legend title will be displayed
   * to allow the user to choose the query thats being displayed.
   *
   * This will overwrite the QueryPageProps customViewQuery.
   */
  customQueryOptions: CustomQueryOption[];

  /**
   * Currently selected custom query. This should be handled in a state. The value is the only thing
   * that needs to be saved for this.
   */
  customQuerySelected: string | null;

  /**
   * Callback function to set the state in another component.
   */
  setCustomQuerySelectedValue: (selectedValue: string | null) => void;
}

export function CustomOptionsDropdown({
  customQueryOptions,
  customQuerySelected,
  setCustomQuerySelectedValue
}: CustomOptionsDropdownProps) {
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

  // Takes the value and finds the matching CustomQueryOption.
  const customQueryObjectSelected = useMemo(
    () =>
      translatedOptions?.find((option) => option.value === customQuerySelected),
    [customQuerySelected]
  );

  return (
    <Select<CustomQueryOption>
      className="mt-2"
      name="customQueryOptions"
      options={translatedOptions}
      value={customQueryObjectSelected}
      onChange={(selectedOption) =>
        setCustomQuerySelectedValue(selectedOption?.value ?? null)
      }
    />
  );
}
