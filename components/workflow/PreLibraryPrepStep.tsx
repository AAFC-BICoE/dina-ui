import { connect, Form, Formik, FormikActions } from "formik";
import { toPairs } from "lodash";
import { useContext, useState } from "react";
import { PreLibraryPrep } from "types/seqdb-api/resources/workflow/PreLibraryPrep";
import {
  ApiClientContext,
  ColumnDefinition,
  FilterBuilderField,
  QueryTable,
  SelectField,
  TextField,
  useQuery
} from "..";
import { Chain, ChainStepTemplate, StepResource } from "../../types/seqdb-api";
import { rsql } from "../filter-builder/rsql";
import { CheckBoxField } from "../formik-connected/CheckBoxField";
import { StepRendererProps } from "./StepRenderer";

export function PreLibraryPrepStep({
  chain,
  chainStepTemplates,
  step
}: StepRendererProps) {
  const { save } = useContext(ApiClientContext);

  const previousStep = chainStepTemplates[chainStepTemplates.indexOf(step) - 1];

  const [visibleSamples, setVisibleSamples] = useState<StepResource[]>([]);
  const [, setLoading] = useState(false);
  const [randomNumber, setRandomNumber] = useState(Math.random());
  const [rsqlFilter, setRsqlFilter] = useState<string>("");

  const visibleSampleIds = visibleSamples.length
    ? visibleSamples.map(sr => sr.sample.id).join(",")
    : 0;

  const { loading: plpSrLoading, response: plpSrResponse } = useQuery<
    StepResource[]
  >({
    filter: {
      "chain.chainId": chain.id,
      "chainStepTemplate.chainStepTemplateId": step.id,
      rsql: `sample.sampleId=in=(${visibleSampleIds})`
    },
    include: "sample,preLibraryPrep",
    path: "stepResource"
  });

  function onFilterSubmit(values, { setSubmitting }: FormikActions<any>) {
    setRsqlFilter(rsql(values.filter));
    setSubmitting(false);
  }

  async function plpFormSubmit(values) {
    const { checkedIds, ...plpValues } = values;

    const selectedSampleIds = toPairs(checkedIds)
      .filter(pair => pair[1])
      .map(pair => pair[0]);

    try {
      setLoading(true);

      const plps = selectedSampleIds.map(() => ({
        resource: plpValues,
        type: "preLibraryPrep"
      }));

      const savedPlps = (await save(plps)) as PreLibraryPrep[];

      const stepResources = selectedSampleIds.map((sampleId, i) => ({
        chain: { id: chain.id, type: chain.type } as Chain,
        chainStepTemplate: {
          id: step.id,
          type: step.type
        } as ChainStepTemplate,
        preLibraryPrep: {
          id: String(savedPlps[i].id),
          type: "preLibraryPrep"
        } as PreLibraryPrep,
        sample: { id: sampleId, type: "sample" },
        type: "INPUT",
        value: savedPlps[i].preLibraryPrepType
      }));

      await save(
        stepResources.map(resource => ({
          resource,
          type: "stepResource"
        }))
      );

      setRandomNumber(Math.random());
    } catch (err) {
      alert(err);
    }
    setLoading(false);
  }

  const SAMPLE_STEP_RESOURCE_COLUMNS: Array<ColumnDefinition<StepResource>> = [
    {
      Header: "Group",
      accessor: "sample.group.groupName"
    },
    "sample.name",
    "sample.version",
    {
      Cell: ({ original }) => {
        if (plpSrLoading || !original.sample) {
          return "Loading...";
        }

        const plpSr = plpSrResponse.data.find(
          sr => sr.sample.id === original.sample.id && sr.value === "SHEARING"
        );
        if (plpSr) {
          return (
            <div style={{ backgroundColor: "rgb(222, 252, 222)" }}>Sheared</div>
          );
        }
        return <span>Not Sheared</span>;
      },
      Header: "Shearing",
      sortable: false
    },
    {
      Cell: ({ original }) => {
        if (plpSrLoading || !original.sample) {
          return "Loading...";
        }
        const stepResource = plpSrResponse.data.find(
          sr =>
            sr.sample.id === original.sample.id && sr.value === "SIZE_SELECTION"
        );
        if (stepResource) {
          return <span>Size Selection Added</span>;
        }
        return <span>No Size Selection</span>;
      },
      Header: "Size Selection",
      sortable: false
    },
    {
      Cell: connect(({ original: sr }) => (
        <div key={sr.id}>
          <CheckBoxField name={`checkedIds[${sr.sample.id}]`} />
        </div>
      )),
      sortable: false
    }
  ];

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
      <Formik initialValues={{ checkedIds: {} }} onSubmit={plpFormSubmit}>
        <Form>
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
                onSuccess={res => setVisibleSamples(res.data)}
                path="stepResource"
              />
            </div>
            <div className="col-6">
              <strong>Add New Shearing/Size Selection Details</strong>
              <div className="card card-body">
                <div className="row">
                  <SelectField
                    className="col-6"
                    options={PREP_TYPE_OPTIONS}
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
              </div>
            </div>
          </div>
        </Form>
      </Formik>
    </>
  );
}

const PREP_TYPE_OPTIONS = [
  {
    label: "Shearing",
    value: "SHEARING"
  },
  {
    label: "Size Selection",
    value: "SIZE_SELECTION"
  }
];
