import { Form, Formik, FormikActions } from "formik";
import { FilterParam } from "kitsu";
import { useState } from "react";
import { StepResource } from "types/seqdb-api";
import { ColumnDefinition, FilterBuilderField, QueryTable } from "..";
import { rsql } from "../filter-builder/rsql";
import { StepRendererProps } from "./StepRenderer";

export function PreLibraryPrepStep({
  chain,
  chainStepTemplates,
  step
}: StepRendererProps) {
  const STEP_RESOURCE_COLUMNS: Array<ColumnDefinition<StepResource>> = [
    "sample.name"
  ];

  const previousStep = chainStepTemplates[chainStepTemplates.indexOf(step) - 1];
  const filterByPreviousStep = `chainStepTemplate.chainStepTemplateId==${
    previousStep.id
  } and chain.chainId==${chain.id}`;

  const [filter, setFilter] = useState<FilterParam>({
    rsql: filterByPreviousStep
  });

  function onFilterSubmit(values, { setSubmitting }: FormikActions<any>) {
    setFilter({
      rsql: [rsql(values.filter), filterByPreviousStep].join(" and ")
    });
    setSubmitting(false);
  }

  return (
    <>
      <h2>Shearing Selection</h2>
      <strong>Filter samples:</strong>
      <Formik initialValues={{ filter: null }} onSubmit={onFilterSubmit}>
        <Form className="form-group">
          <FilterBuilderField
            filterAttributes={["sample.name"]}
            name="filter"
          />
          <button className="btn btn-primary" type="submit">
            Search
          </button>
        </Form>
      </Formik>
      <div className="row form-group">
        <div className="col-6">
          <QueryTable
            columns={STEP_RESOURCE_COLUMNS}
            filter={filter}
            include="sample"
            path="stepResource"
          />
        </div>
      </div>
    </>
  );
}
