import {
  DinaFormSection,
  Tooltip,
  ResourceSelectFieldCustomQuery,
  ResourceSelectFieldCustomQueryProps,
  useDinaFormContext,
  useSearchWsCustomQuery,
  useBulkEditTabContext
} from "common-ui";
import { MaterialSample } from "../../types/collection-api";
import { DinaMessage } from "../../intl/dina-ui-intl";
import { FaDna } from "react-icons/fa";

/**
 * Generates query-generating function to search by material sample name or id and exclude descendants.
 * @param currentHierarchyIds list of ids to exclude from search results (the current material sample(s) and its descendants). If undefined, no items will be excluded.
 * @returns options for ResourceSelectFieldCustomQuery to search for parent material samples, excluding descendants of the current hierarchy item.
 */
export function getCustomQueryOptions(
  currentHierarchyIds?: string[]
): ResourceSelectFieldCustomQueryProps<MaterialSample>["customQueryOptions"] {
  return (searchQuery) => ({
    indexName: "dina_material_sample_index",
    searchQuery,
    query: (value: string) => ({
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
                  bool: {
                    must: [
                      {
                        wildcard: {
                          "data.id": `*${value}*`
                        }
                      },
                      {
                        bool: {
                          must_not: [
                            {
                              exists: {
                                field: "data.attributes.materialSampleName"
                              }
                            }
                          ]
                        }
                      }
                    ]
                  }
                }
              ],
              minimum_should_match: 1
            }
          : { must: [{ match_all: {} }] }),
        ...(currentHierarchyIds?.length
          ? {
              must_not: [
                {
                  nested: {
                    path: "data.attributes.hierarchy",
                    query: {
                      bool: {
                        should: currentHierarchyIds.map((id) => ({
                          term: { "data.attributes.hierarchy.uuid": id }
                        }))
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
  enableCollectingEvent?: boolean;
}

/**
 * Renders a section with a parent select field. Excludes the current material sample
 * and its descendants from the parent select options. The parent select field is only
 * rendered if the form is not read-only. Uses elasticsearch for custom query.
 * @param classNames optional additional class names for the section container
 * @param enableCollectingEvent disables parent select field when collecting event is enabled.
 * @returns Parent select field.
 */
export function ParentSelectSection({
  classNames,
  enableCollectingEvent
}: ParentSelectSectionProps) {
  const { readOnly } = useDinaFormContext();

  return readOnly ? undefined : (
    <div className={`${classNames} row`}>
      <DinaFormSection horizontal="flex">
        <div className="d-flex flex-row gap-1">
          <ParentSelectField
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
  className?: string;
  enableCollectingEvent?: boolean;
}

function ParentSelectField({
  resourcePath = "collection-api/material-sample",
  enableCollectingEvent,
  className
}: ParentSelectFieldProps) {
  const { readOnly, initialValues } = useDinaFormContext();
  const currentHierarchyItemId = initialValues?.hierarchy?.find(
    (item) => item.rank === 1
  )?.uuid; // find the hierarchy item with rank 1 (the material sample itself) from form initial values to determine which items to exclude from parent select options
  const bulkEditCtx = useBulkEditTabContext();

  const currentHierarchyIds: string[] | undefined = bulkEditCtx
    ? bulkEditCtx.resourceHooks.map(
        (hook) =>
          (
            hook.formRef.current?.initialValues as MaterialSample
          )?.hierarchy?.find((item) => item.rank === 1)?.uuid
      ) // find the hierarchy item with rank 1 (the material sample itself) for each resource in bulk edit context
    : currentHierarchyItemId
    ? [currentHierarchyItemId]
    : undefined; // if not in bulk edit context, use the current hierarchy item id if available, otherwise undefined

  return (
    <DinaFormSection horizontal={"flex"} readOnly={readOnly}>
      <ResourceSelectFieldCustomQuery<MaterialSample>
        name="parentMaterialSample"
        useCustomQuery={useSearchWsCustomQuery}
        customQueryOptions={getCustomQueryOptions(currentHierarchyIds)}
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
