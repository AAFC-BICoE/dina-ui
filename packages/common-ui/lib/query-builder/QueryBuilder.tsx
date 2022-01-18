import { useMemo } from "react";
import useSWR from "swr";
import { DinaForm, SubmitButton, useApiClient } from "..";
import { QueryRow } from "./QueryRow";
import { v4 as uuidv4 } from "uuid";
import { FieldArray } from "formik";
import { isArray } from "lodash";

export function QueryBuilder() {
  const { apiClient } = useApiClient();

  async function fetchQueryFieldsByIndex(indexName) {
    const resp = await apiClient.axios.get("search-api/search/mapping", {
      params: { indexName }
    });

    const result: [{}] = [{}];

    Object.keys(resp.data)
      .filter(key => key.includes("data.attributes."))
      .map(key => {
        const fieldNameLabel = key.substring(
          "data.attributes.".length,
          key.lastIndexOf(".")
        );
        result.push({
          label: fieldNameLabel,
          value: fieldNameLabel,
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
  } = useSWR(["dina_material_sample_index", cacheId], fetchQueryFieldsByIndex, {
    shouldRetryOnError: true,
    revalidateOnFocus: false,
    revalidateOnReconnect: false
  });

  if (loading || error) return <></>;

  return (
    <DinaForm initialValues={{}}>
      <FieldArray name={"queryRows"}>
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
          }

          function removeRow(index: number) {
            fieldArrayProps.remove(index);
          }

          /* Making sure there is a single row present as default*/
          if (
            !fieldArrayProps.form.getFieldMeta("queryRows").value ||
            !isArray(fieldArrayProps.form.getFieldMeta("queryRows").value)
          ) {
            addRow();
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
      <SubmitButton className="ms-auto" />
    </DinaForm>
  );
}
