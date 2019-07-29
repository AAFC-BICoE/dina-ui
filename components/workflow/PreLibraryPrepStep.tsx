import { Form, Formik, FormikActions } from "formik";
import { useContext, useState } from "react";
import { PreLibraryPrep } from "types/seqdb-api/resources/workflow/PreLibraryPrep";
import {
  ApiClientContext,
  ColumnDefinition,
  FilterBuilderField,
  QueryTable,
  SelectField,
  TextField
} from "..";
import { Chain, ChainStepTemplate, StepResource } from "../../types/seqdb-api";
import { serialize } from "../../util/serialize";
import { rsql } from "../filter-builder/rsql";
import { StepRendererProps } from "./StepRenderer";

export function PreLibraryPrepStep({
  chain,
  chainStepTemplates,
  step
}: StepRendererProps) {
  const { doOperations } = useContext(ApiClientContext);

  const SAMPLE_STEP_RESOURCE_COLUMNS: Array<ColumnDefinition<StepResource>> = [
    {
      Header: "Group",
      accessor: "sample.group.groupName"
    },
    "sample.name",
    "sample.version"
  ];

  const PRE_LIBRARY_PREP_COLUMNS: Array<ColumnDefinition<StepResource>> = [
    { Header: "Input Amount", accessor: "preLibraryPrep.inputAmount" },
    { Header: "Concentration", accessor: "preLibraryPrep.concentration" }
  ];

  const previousStep = chainStepTemplates[chainStepTemplates.indexOf(step) - 1];

  const [, setLoading] = useState(false);
  const [randomNumber, setRandomNumber] = useState(Math.random());
  const [rsqlFilter, setRsqlFilter] = useState<string>("");

  function onFilterSubmit(values, { setSubmitting }: FormikActions<any>) {
    setRsqlFilter(rsql(values.filter));
    setSubmitting(false);
  }

  async function plpFormSubmit(values) {
    try {
      setLoading(true);

      const serializedPlp = await serialize({
        resource: values,
        type: "preLibraryPrep"
      });

      const [response] = await doOperations([
        {
          op: "POST",
          path: "preLibraryPrep",
          value: serializedPlp
        }
      ]);

      const plpId = response.data.id;

      const stepResource: StepResource = {
        chain: { id: chain.id, type: chain.type } as Chain,
        chainStepTemplate: {
          id: step.id,
          type: "chainStepTemplate"
        } as ChainStepTemplate,
        preLibraryPrep: {
          id: String(plpId),
          type: "preLibraryPrep"
        } as PreLibraryPrep,
        type: "INPUT",
        value: "SHEARING"
      };

      const serializedSr = await serialize({
        resource: stepResource,
        type: "stepResource"
      });

      await doOperations([
        {
          op: "POST",
          path: "stepResource",
          value: serializedSr
        }
      ]);

      setRandomNumber(Math.random());
    } catch (err) {
      alert(err);
    }
    setLoading(false);
  }

  return (
    <>
      <h2>Shearing/Size Selection</h2>
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
          <strong>Selected Samples</strong>
          <QueryTable
            columns={SAMPLE_STEP_RESOURCE_COLUMNS}
            filter={{
              "chain.chainId": chain.id,
              "chainStepTemplate.chainStepTemplateId": previousStep.id,
              rsql: rsqlFilter
            }}
            include="sample,sample.group"
            path="stepResource"
          />
        </div>
        <div className="col-6">
          <strong>Add New Shearing/Size Selection Details</strong>
          <Formik initialValues={{}} onSubmit={plpFormSubmit}>
            <Form className="card card-body">
              <div className="row">
                <SelectField
                  className="col-6"
                  options={[
                    {
                      label: "Shearing",
                      value: "SHEARING"
                    },
                    {
                      label: "Size Selection",
                      value: "SIZE_SELECTION"
                    }
                  ]}
                  name="preLibraryPrepType"
                />
                <TextField className="col-6" name="inputAmount" />
                <TextField className="col-6" name="concentration" />
              </div>
              <div>
                <button className="btn btn-primary" type="submit">
                  Add
                </button>
              </div>
            </Form>
          </Formik>
          <div>
            <strong>Shearing/Size Selection Details</strong>
          </div>
          <QueryTable
            columns={PRE_LIBRARY_PREP_COLUMNS}
            filter={{
              "chain.chainId": chain.id,
              "chainStepTemplate.chainStepTemplateId": step.id,
              rsql: `preLibraryPrep.inputAmount!=${randomNumber}`
            }}
            include="sample,preLibraryPrep"
            path="stepResource"
          />
        </div>
      </div>
    </>
  );
}
