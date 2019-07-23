import { connect, Form, Formik, FormikActions, FormikProps } from "formik";
import { FilterParam } from "kitsu";
import { toPairs } from "lodash";
import { useContext, useState } from "react";
import {
  ApiClientContext,
  ColumnDefinition,
  FilterBuilderField,
  QueryTable
} from "../../components";
import { rsql } from "../../components/filter-builder/rsql";
import { CheckBoxField } from "../../components/formik-connected/CheckBoxField";
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

  const [availableSamples, setAvailableSamples] = useState<Sample[]>([]);
  const [lastCheckedSample, setLastCheckedSample] = useState<Sample>();

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
      Cell: connect(({ formik: { setFieldValue }, original }) => (
        <div className="row" key={original.id}>
          <button
            className="btn btn-primary btn-sm col-6"
            onClick={() => selectSamples([original])}
          >
            -->
          </button>
          <div className="col-6">
            <CheckBoxField
              onClick={e => {
                const checkedSample = original;
                if (lastCheckedSample && e.shiftKey) {
                  const checked: boolean = (e.target as any).checked;

                  const currentIndex = availableSamples.indexOf(checkedSample);
                  const lastIndex = availableSamples.indexOf(lastCheckedSample);

                  const [lowIndex, highIndex] = [currentIndex, lastIndex].sort(
                    (a, b) => a - b
                  );

                  const samplesToToggle = availableSamples.slice(
                    lowIndex,
                    highIndex + 1
                  );

                  for (const sample of samplesToToggle) {
                    setFieldValue(`checkedIds[${sample.id}]`, checked);
                  }
                }
                setLastCheckedSample(checkedSample);
              }}
              name={`checkedIds[${original.id}]`}
            />
          </div>
        </div>
      )),
      sortable: false
    }
  ];

  function onFilterSubmit(values, { setSubmitting }: FormikActions<any>) {
    setFilter({ rsql: rsql(values.filter) });
    setSubmitting(false);
  }

  async function selectSamples(samples: Sample[]) {
    const newStepResources: StepResource[] = samples.map(sample => ({
      chain,
      chainTemplateId: Number(chain.chainTemplate.id),
      sample,
      stepTemplateId: Number(stepTemplate.id),
      type: "INPUT",
      value: "SAMPLE"
    }));

    const serialized = await Promise.all(
      newStepResources.map(newStepResource =>
        serialize({
          resource: newStepResource,
          type: "stepResource"
        })
      )
    );

    let tempId = -100;
    for (const s of serialized) {
      s.id = tempId--;
    }

    try {
      await doOperations(
        serialized.map(s => ({
          op: "POST",
          path: "stepResource",
          value: s
        }))
      );

      setRandomNumber(Math.random());
    } catch (err) {
      alert(err);
    }
  }

  async function selectAllCheckedSamples(formikProps: FormikProps<any>) {
    const { checkedIds } = formikProps.values;
    const ids = toPairs(checkedIds)
      .filter(pair => pair[1])
      .map(pair => pair[0]);

    const samples: Sample[] = ids.map(id => ({
      id,
      type: "sample"
    })) as Sample[];

    await selectSamples(samples);
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
        <Formik initialValues={{ checkedIds: {} }} onSubmit={null}>
          {formikProps => (
            <>
              <div className="col-5">
                <strong>Available Samples</strong>
                <QueryTable
                  columns={SELECTABLE_SAMPLE_COLUMNS}
                  filter={filter}
                  include="group"
                  onSuccess={response => setAvailableSamples(response.data)}
                  path="sample"
                />
              </div>
              <div className="col-2" style={{ marginTop: "100px" }}>
                <button
                  className="btn btn-primary"
                  onClick={() => selectAllCheckedSamples(formikProps)}
                >
                  -->
                </button>
              </div>
            </>
          )}
        </Formik>
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
