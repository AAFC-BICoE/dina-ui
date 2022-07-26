import {
  DinaFormSection,
  FieldWrapperProps,
  LoadingSpinner,
  useApiClient
} from "..";
import { QueryRow } from "./QueryRow";
import { FieldArray } from "formik";
import { GroupSelectField } from "../../../dina-ui/components";
import { useMemo } from "react";
import { v4 as uuidv4 } from "uuid";
import useSWR from "swr";
import { ESIndexMapping } from "./types";

interface QueryBuilderProps extends FieldWrapperProps {
  indexName: string;
  onGroupChange: (currentSubmittedValues: any) => void;
}

export function QueryBuilder({
  name,
  indexName,
  onGroupChange
}: QueryBuilderProps) {
  const { apiClient } = useApiClient();

  /**
   * The query builder options are generated from the elastic search index. This method will
   * request the mappings from the index.
   *
   * @param searchIndexName index to retrieve from.
   * @returns ESIndexMapping[]
   */
  async function fetchQueryFieldsByIndex(searchIndexName) {
    const resp = await apiClient.axios.get("search-api/search-ws/mapping", {
      params: { indexName: searchIndexName }
    });

    const result: ESIndexMapping[] = [];

    // Read index attributes.
    resp.data?.attributes
      ?.filter(key => key.name !== "type")
      .map(key => {
        const path = key.path;
        const prefix = "data.attributes";
        let attrPrefix;
        if (path && path.includes(prefix)) {
          attrPrefix = path.substring(prefix.length + 1);
        }
        result.push({
          label: attrPrefix ? attrPrefix + "." + key.name : key.name,
          value: key.path
            ? key.path + "." + key.name
            : key.name === "id"
            ? "data." + key.name
            : key.name,
          type: key.type,
          path: key.path,
          distinctTerm: key.distinct_term_agg
        });
      });

    // Read relationship attributes.
    resp.data?.relationships?.map(relationship => {
      relationship?.attributes?.map(relationshipAttribute => {
        // This is the user-friendly label to display on the search dropdown.
        const attributeLabel = relationshipAttribute.path?.includes(".")
          ? relationshipAttribute.path.substring(
              relationshipAttribute.path.indexOf(".") + 1
            ) +
            "." +
            relationshipAttribute.name
          : relationshipAttribute.name;

        result.push({
          label: attributeLabel,
          value: relationship.value + "." + attributeLabel,
          type: relationshipAttribute.type,
          path: relationshipAttribute.path,
          parentName: relationship.referencedBy,
          parentPath: relationship.path,
          distinctTerm: relationshipAttribute.distinct_term_agg
        });
      });
    });
    return result;
  }

  // Invalidate the query cache on query change, don't use SWR's built-in cache:
  const cacheId = useMemo(() => uuidv4(), []);

  const {
    data,
    error: indexError,
    isValidating: loading
  } = useSWR<ESIndexMapping[], any>(
    [indexName, cacheId],
    fetchQueryFieldsByIndex,
    {
      shouldRetryOnError: true,
      revalidateOnFocus: false,
      revalidateOnReconnect: false
    }
  );

  // Display loading spinner when performing request for the index.
  if (loading) {
    return <LoadingSpinner loading={true} />;
  }

  // Display an error if mapping could not be retrieved.
  if (indexError) {
    return (
      <div
        className="alert alert-danger"
        style={{
          whiteSpace: "pre-line"
        }}
      >
        Could not communicate with elastic search.
      </div>
    );
  }

  const sortedData = data
    ?.sort((a, b) => a.label.localeCompare(b.label))
    .filter(prop => !prop.label.startsWith("group"));

  return (
    <>
      <FieldArray name={name}>
        {fieldArrayProps => {
          const elements: [] = fieldArrayProps.form.values.queryRows;

          function addRow() {
            fieldArrayProps.push(
              <QueryRow
                name={fieldArrayProps.name}
                indexName={indexName}
                esIndexMapping={sortedData as any}
                index={elements?.length ?? 0}
                removeRow={removeRow}
                addRow={addRow}
              />
            );
            // initialize the logic switch value to be "and"//
            fieldArrayProps.form.setFieldValue(
              `${fieldArrayProps.name}[${
                elements?.length ?? 0
              }].compoundQueryType`,
              "and"
            );
          }

          function removeRow(index) {
            fieldArrayProps.remove(index);
          }

          return elements?.length > 0
            ? elements?.map((_, index) => (
                <QueryRow
                  name={fieldArrayProps.name}
                  indexName={indexName}
                  key={index}
                  index={index}
                  addRow={addRow}
                  removeRow={removeRow}
                  esIndexMapping={sortedData as any}
                />
              ))
            : null;
        }}
      </FieldArray>
      <DinaFormSection horizontal={"flex"}>
        <GroupSelectField
          isMulti={true}
          name="group"
          className="col-md-4"
          onChange={(value, formik) =>
            onGroupChange({
              submittedValues: { ...formik.values, group: value }
            })
          }
        />
      </DinaFormSection>
    </>
  );
}
