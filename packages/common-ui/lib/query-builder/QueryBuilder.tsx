import { useMemo } from "react";
import useSWR from "swr";
import { DinaForm, SubmitButton, useApiClient } from "..";
import { QueryRow, QueryRowExportProps } from "./QueryRow";
import { v4 as uuidv4 } from "uuid";
import { FieldArray } from "formik";
import { isArray } from "lodash";
import Bodybuilder from "bodybuilder";

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

  function onSubmit(props) {
    const { submittedValues, formik } = props;
    transformQueryBuilderToDSL(submittedValues.queryRows);
  }

  function transformQueryBuilderToDSL(
    exportedQueryRows: QueryRowExportProps[]
  ) {
    let builder = Bodybuilder();

    exportedQueryRows.map((queryRow, idx) => {
      if (queryRow.boolean) {
        // search will be built as filter
        if (queryRow.compoundQueryType === "and") {
          builder = builder.andFilter(
            "term",
            queryRow.fieldName,
            queryRow.boolean
          );
        } else if (queryRow.compoundQueryType === "or") {
          builder = builder.orFilter(
            "term",
            queryRow.fieldName,
            queryRow.boolean
          );
        } else if (idx === 0) {
          builder = builder.filter(
            "term",
            queryRow.fieldName,
            queryRow.boolean
          );
        }
      } else if (queryRow.date) {
        // search will be built as filter
        if (queryRow.compoundQueryType === "and") {
          builder = builder.andFilter(
            "term",
            queryRow.fieldName,
            queryRow.date
          );
        } else if (queryRow.compoundQueryType === "or") {
          builder.orFilter("term", queryRow.fieldName, queryRow.date);
        } else if (idx === 0) {
          builder.filter("term", queryRow.fieldName, queryRow.date);
        }
      } else if (queryRow.number) {
        // search will be built as filter
        if (queryRow.compoundQueryType === "and") {
          builder = builder.andFilter(
            "term",
            queryRow.fieldName,
            queryRow.number
          );
        } else if (queryRow.compoundQueryType === "or") {
          builder.orFilter("term", queryRow.fieldName, queryRow.number);
        } else if (idx === 0) {
          builder.filter("term", queryRow.fieldName, queryRow.number);
        }
      } else if (queryRow.matchValue) {
        // string search will be built as query
        if (queryRow.compoundQueryType === "and") {
          builder = builder.andQuery(
            queryRow.matchType as string,
            queryRow.fieldName,
            queryRow.matchValue
          );
        } else if (queryRow.compoundQueryType === "or") {
          builder.orQuery(
            queryRow.matchType as string,
            queryRow.fieldName,
            queryRow.matchValue
          );
        } else if (idx === 0) {
          builder.query(
            queryRow.matchType as string,
            queryRow.fieldName,
            queryRow.matchValue
          );
        }
      }
    });
    const DSLquery = builder.build();
  }

  return (
    <DinaForm initialValues={{}} onSubmit={onSubmit}>
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
            // initialize the logic switch value to be "and"//
            fieldArrayProps.form.setFieldValue(
              `${fieldArrayProps.name}[${
                elements?.length ?? 0
              }].compoundQueryType`,
              "and"
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
