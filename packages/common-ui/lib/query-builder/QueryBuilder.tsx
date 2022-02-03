import { useMemo } from "react";
import useSWR from "swr";
import { FieldWrapperProps, useApiClient } from "..";
import { QueryRow } from "./QueryRow";
import { v4 as uuidv4 } from "uuid";
import { FieldArray } from "formik";

interface QueryBuilderProps extends FieldWrapperProps {
  indexName: string;
}
export function QueryBuilder({ indexName, name }: QueryBuilderProps) {
  const { apiClient } = useApiClient();

  async function fetchQueryFieldsByIndex(searchIndexName) {
    const resp = await apiClient.axios.get("search-api/search-ws/mapping", {
      params: { indexName: searchIndexName }
    });
    const result: {}[] = [];

    Object.keys(resp.data)
      .filter(key => key.includes("data.attributes."))
      .map(key => {
        const fieldNameLabel = key.substring(
          "data.attributes.".length,
          key.lastIndexOf(".")
        );

        const fieldValue = key.substring(
          0,
          key.indexOf(fieldNameLabel) + fieldNameLabel.length
        );

        result.push({
          label: fieldNameLabel,
          value: fieldValue,
          type: resp.data?.[key]
        });
      });
    return result;
  }

  // Invalidate the query cache on query change, don't use SWR's built-in cache:
  const cacheId = useMemo(() => uuidv4(), []);

  const {
    data,
    error,
    isValidating: loading
  } = useSWR([indexName, cacheId], fetchQueryFieldsByIndex, {
    shouldRetryOnError: true,
    revalidateOnFocus: false,
    revalidateOnReconnect: false
  });

  if (loading || error) return <></>;

  return (
    <FieldArray name={name}>
      {fieldArrayProps => {
        const elements: [] = fieldArrayProps.form.values.queryRows;

        function addRow() {
          fieldArrayProps.push(
            <QueryRow
              name={fieldArrayProps.name}
              esIndexMapping={data as any}
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
                key={index}
                index={index}
                addRow={addRow}
                removeRow={removeRow}
                esIndexMapping={data as any}
              />
            ))
          : null;
      }}
    </FieldArray>
  );
}
