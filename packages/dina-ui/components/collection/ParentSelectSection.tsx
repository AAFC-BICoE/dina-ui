import {
  DinaFormSection,
  Tooltip,
  ResourceSelectFieldCustomQuery,
  ResourceSelectFieldCustomQueryProps,
  useDinaFormContext,
  useSearchWsCustomQuery
} from "common-ui";
import { HierarchyItem, MaterialSample } from "../../types/collection-api";
import { DinaMessage } from "../../intl/dina-ui-intl";
import _ from "lodash";
import { FaDna } from "react-icons/fa";

/**
 * Generates query-generating function to search by material sample name or id and exclude descendants.
 * @param currentHierarchyItem the current hierarchy item, used to determine the rank and id for excluding descendants. If not provided, no items will be excluded.
 * @returns options for ResourceSelectFieldCustomQuery to search for parent material samples, excluding descendants of the current hierarchy item.
 */
function getCustomQueryOptions(
  currentHierarchyItem?: HierarchyItem
): ResourceSelectFieldCustomQueryProps<MaterialSample>["customQueryOptions"] {
  return (searchQuery) => ({
    indexName: "dina_material_sample_index",
    searchQuery, // search term
    query: (value: string) => ({
      // function to generate the query based on the search term
      bool: {
        ...(value
          ? {
              should: [
                {
                  wildcard: {
                    "data.attributes.materialSampleName": `*${value}*`
                  }
                },
                {
                  wildcard: {
                    "data.id": `*${value}*`
                  }
                }
              ],
              minimum_should_match: 1
            }
          : { must: [{ match_all: {} }] }),
        ...(currentHierarchyItem
          ? {
              must_not: [
                {
                  nested: {
                    path: "data.attributes.hierarchy",
                    query: {
                      term: {
                        "data.attributes.hierarchy.uuid":
                          currentHierarchyItem.uuid
                      }
                    }
                  }
                }
              ]
            }
          : {})
      }
    })
  });
}

export interface ParentSelectSectionProps {
  resourcePath?: string;
  classNames?: string;
  filterList?: (item: MaterialSample) => boolean;
  currentHierarchyItem?: HierarchyItem;
  enableCollectingEvent?: boolean;
}

/**
 * Renders a section with a parent select field. Excludes the current material sample
 * and its descendants from the parent select options. The parent select field is only
 * rendered if the form is not read-only. Uses elasticsearch for custom query.
 * @param classNames optional additional class names for the section container
 * @param currentHierarchyItem the current hierarchy item, used to determine which items to exclude from the parent select options. If not provided, no items will be excluded.
 * @param enableCollectingEvent disables parent select field when collecting event is enabled.
 * @returns Parent select field.
 */
export function ParentSelectSection({
  classNames,
  currentHierarchyItem,
  enableCollectingEvent
}: ParentSelectSectionProps) {
  const { readOnly } = useDinaFormContext();

  return readOnly ? undefined : (
    <div className={`${classNames} row`}>
      <DinaFormSection horizontal="flex">
        <div className="d-flex flex-row gap-1">
          <ParentSelectField
            currentHierarchyItem={currentHierarchyItem}
            enableCollectingEvent={enableCollectingEvent}
            className="flex-grow-1 mb-2"
          />
        </div>
      </DinaFormSection>
    </div>
  );
}

interface ParentSelectFieldProps {
  resourcePath?: string;
  currentHierarchyItem?: HierarchyItem;
  className?: string;
  enableCollectingEvent?: boolean;
}

function ParentSelectField({
  resourcePath = "collection-api/material-sample",
  currentHierarchyItem,
  className,
  enableCollectingEvent
}: ParentSelectFieldProps) {
  const { readOnly } = useDinaFormContext();
  return (
    <DinaFormSection horizontal={"flex"} readOnly={readOnly}>
      <ResourceSelectFieldCustomQuery<MaterialSample>
        name="parentMaterialSample"
        useCustomQuery={useSearchWsCustomQuery}
        customQueryOptions={getCustomQueryOptions(currentHierarchyItem)}
        filter={() => ({})}
        readOnlyLink="/collection/material-sample/view?id="
        model={resourcePath}
        className={"parent-material-sample-field " + (className || "")}
        optionLabel={(sample) => sample.materialSampleName || sample.id}
        hideLabel={readOnly}
        removeLabel={readOnly}
        removeBottomMargin={true}
        disableTemplateCheckbox={true}
        isDisabled={enableCollectingEvent}
        label={
          <span>
            <FaDna className="me-2" />
            <DinaMessage id="parentMaterialSample" />
            {enableCollectingEvent && (
              <Tooltip id="parentMaterialSampleDisabledTooltip" />
            )}
          </span>
        }
      />
    </DinaFormSection>
  );
}
