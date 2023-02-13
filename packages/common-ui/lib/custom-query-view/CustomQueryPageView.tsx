import { KitsuResource } from "kitsu";
import { DinaMessage } from "../../../dina-ui/intl/dina-ui-intl";
import { FieldSet, QueryPage, QueryPageProps } from "..";
import { DINAUI_MESSAGES_ENGLISH } from "../../../dina-ui/intl/dina-ui-en";
import Select from "react-select";
import { JsonTree } from "react-awesome-query-builder";

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
  readonly customQuery: JsonTree | undefined;
}

export interface CustomQueryPageViewProps<TData extends KitsuResource>
  extends QueryPageProps<TData> {
  /**
   * Legend title to be displayed in the card view.
   */
  titleKey: keyof typeof DINAUI_MESSAGES_ENGLISH;

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
  // const [customQuerySelected, setCustomQuerySelected] = useState

  return (
    <FieldSet
      legend={<DinaMessage id={titleKey} />}
      wrapLegend={(legend) => (
        <div className="row">
          {customQueryOptions ? (
            <>
              <div className="col-sm-8">{legend}</div>
              <div className="col-sm-4">
                <Select
                  className="mt-2"
                  name="customQueryOptions"
                  options={customQueryOptions}
                />
              </div>
            </>
          ) : (
            <>{legend}</>
          )}
        </div>
      )}
    >
      <QueryPage<TData> {...queryPageProps} />
    </FieldSet>
  );
}
