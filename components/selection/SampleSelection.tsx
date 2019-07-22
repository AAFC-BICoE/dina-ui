import { Form, Formik, FormikActions } from "formik";
import { FilterParam } from "kitsu";
import { useContext, useState } from "react";
import {
  ApiClientContext,
  ColumnDefinition,
  FilterBuilderField,
  QueryTable
} from "../../components";
import { rsql } from "../../components/filter-builder/rsql";
import { Sample } from "../../types/seqdb-api/resources/Sample";
import { Chain } from "../../types/seqdb-api/resources/workflow/Chain";
import { StepResource } from "../../types/seqdb-api/resources/workflow/StepResource";
import { StepTemplate } from "../../types/seqdb-api/resources/workflow/StepTemplate";
import { serialize } from "../../util/serialize";

interface SampleSelectionProps {
  chain: Chain;
  stepTemplate: StepTemplate;
}

export function SampleSelection({ chain, stepTemplate }: SampleSelectionProps) {
  const { doOperations } = useContext(ApiClientContext);
  const [filter, setFilter] = useState<FilterParam>();

  // Random number to be changed every time a sample is selected.
  // This number is passed into the Query component's query, which re-fetches
  // the data when any part of the query changes.
  const [randomNumber, setRandomNumber] = useState(Math.random());

  const SELECTED_SAMPLE_COLUMNS: Array<ColumnDefinition<any>> = [
    {
      Header: "Group Name",
      accessor: "sample.group.groupName"
    },
    {
      Header: "Name",
      accessor: "sample.name"
    },
    {
      Header: "Version",
      accessor: "sample.version"
    },
    {
      Cell: ({ original }) => (
        <button className="btn btn-dark" onClick={() => removeSample(original)}>
          Remove
        </button>
      )
    }
  ];

  const SELECTABLE_SAMPLE_COLUMNS: Array<ColumnDefinition<any>> = [
    {
      Header: "Group Name",
      accessor: "group.groupName"
    },
    "name",
    "version",
    {
      Cell: ({ original }) => (
        <>
          <div className="row">
            <button
              className="btn btn-primary btn-sm col-6"
              onClick={() => selectSample(original)}
            >
              -->
            </button>
            <div className="col-6">
              <input
                key={original.id}
                type="checkbox"
                style={{ width: "20px", height: "20px" }}
              />
            </div>
          </div>
        </>
      ),
      sortable: false
    }
  ];

  function onFilterSubmit(values, { setSubmitting }: FormikActions<any>) {
    setFilter({ rsql: rsql(values.filter) });
    setSubmitting(false);
  }

  async function selectSample(sample: Sample) {
    const newStepResource: StepResource = {
      chain,
      chainTemplateId: Number(chain.chainTemplate.id),
      sample,
      stepTemplateId: Number(stepTemplate.id),
      type: "INPUT",
      value: "SAMPLE"
    };

    const serialized = await serialize({
      resource: newStepResource,
      type: "stepResource"
    });

    serialized.id = -100;

    try {
      await doOperations([
        {
          op: "POST",
          path: "stepResource",
          value: serialized
        }
      ]);

      setRandomNumber(Math.random());
    } catch (err) {
      // tslint:disable-next-line: no-console
      alert(err);
    }
  }

  async function removeSample(stepResource: StepResource) {
    try {
      await doOperations([
        {
          op: "DELETE",
          path: `stepResource/${stepResource.id}`,
          value: {
            id: stepResource.id,
            type: "stepResource"
          }
        }
      ]);

      setRandomNumber(Math.random());
    } catch (err) {
      alert(err);
    }
  }

  return (
    <>
      <h2>Sample Selection</h2>
      <strong>Filter available samples:</strong>
      <Formik initialValues={{ filter: null }} onSubmit={onFilterSubmit}>
        <Form className="form-group">
          <FilterBuilderField filterAttributes={["name"]} name="filter" />
          <button className="btn btn-primary" type="submit">
            Search
          </button>
        </Form>
      </Formik>
      <div className="row form-group">
        <div className="col-5">
          <strong>Available Samples</strong>
          <QueryTable
            columns={SELECTABLE_SAMPLE_COLUMNS}
            filter={filter}
            include="group"
            path="sample"
          />
        </div>
        <div className="col-2" style={{ marginTop: "100px" }}>
          <button className="btn btn-primary">--></button>
        </div>
        <div className="col-5">
          <strong>Selected Samples</strong>
          <QueryTable
            columns={SELECTED_SAMPLE_COLUMNS}
            filter={{
              "chain.chainId": chain.id,
              rsql: `sample.version!=${randomNumber}`,
              stepTemplateId: stepTemplate.id
            }}
            include="sample,sample.group"
            path="stepResource"
          />
        </div>
      </div>
    </>
  );
}
