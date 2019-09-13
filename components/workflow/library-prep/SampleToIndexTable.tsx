import { Form, Formik, FormikActions } from "formik";
import { useContext, useState } from "react";
import {
  ApiClientContext,
  ColumnDefinition,
  NumberField,
  QueryTable,
  ResourceSelectField,
  SubmitButton,
  TextField,
  useCacheableQueryLoader,
  useQuery
} from "../..";
import {
  Chain,
  ChainStepTemplate,
  LibraryPrep,
  LibraryPrepBatch,
  PcrPrimer,
  StepResource
} from "../../../types/seqdb-api";
import { filterBy } from "../../../util/rsql";

interface SampleToIndexTableProps {
  chain: Chain;
  libraryPrepBatch: LibraryPrepBatch;
  sampleSelectionStep: ChainStepTemplate;
}

export function SampleToIndexTable({
  chain,
  libraryPrepBatch,
  sampleSelectionStep
}: SampleToIndexTableProps) {
  const { save } = useContext(ApiClientContext);
  const resourceSelectLoader = useCacheableQueryLoader();

  // Current visible sample StepResources in the "sample selection" table.
  const [visibleSampleSrs, setVisibleSampleSrs] = useState<StepResource[]>([]);

  // Timestamp of the last table save.
  const [lastPrepTableSave, setLastPrepTableSave] = useState<number>();

  // Query the libraryPreps of this batch.
  const { loading: libraryPrepsLoading } = useQuery<LibraryPrep[]>(
    {
      // Optimize query speed by reducing the amount of requested fields.
      fields: {
        pcrPrimer: "name",
        sample: "name"
      },
      include: "sample,indexI5,indexI7",
      page: { limit: 1000 },
      path: `libraryPrepBatch/${libraryPrepBatch.id}/libraryPreps`
    },
    {
      // Run this query whenever there is a new set of sample StepResources.
      deps: [visibleSampleSrs],
      onSuccess: ({ data: libraryPreps }) => {
        // Attach the libraryPreps to the samples.
        for (const sampleSr of visibleSampleSrs) {
          const libraryPrepForThisSample = libraryPreps.find(
            libraryPrep => libraryPrep.sample.id === sampleSr.sample.id
          );

          if (libraryPrepForThisSample) {
            sampleSr.libraryPrep = libraryPrepForThisSample;
          }
        }
      }
    }
  );

  async function onSubmit(
    submittedValues,
    { setSubmitting }: FormikActions<any>
  ) {
    try {
      const sampleSrs: StepResource[] = submittedValues.sampleSrs;

      const libraryPreps = [];
      for (const sr of sampleSrs) {
        if (sr.libraryPrep) {
          sr.libraryPrep.sample = sr.sample;
          sr.libraryPrep.libraryPrepBatch = libraryPrepBatch;
          if (sr.libraryPrep.indexI5) {
            sr.libraryPrep.indexI5.type = "pcrPrimer";
          }
          if (sr.libraryPrep.indexI7) {
            sr.libraryPrep.indexI7.type = "pcrPrimer";
          }
          libraryPreps.push(sr.libraryPrep);
        }
      }

      const saveArgs = libraryPreps.map(resource => ({
        resource,
        type: "libraryPrep"
      }));

      await save(saveArgs);

      setLastPrepTableSave(Date.now());
    } catch (err) {
      alert(err);
    }

    setSubmitting(false);
  }

  const COLUMNS: Array<ColumnDefinition<StepResource>> = [
    "sample.name",
    // Library prep fields
    {
      Cell: ({ index }) => (
        <NumberField
          hideLabel={true}
          name={`sampleSrs[${index}].libraryPrep.inputNg`}
        />
      ),
      Header: "Input (ng)",
      sortable: false
    },
    {
      Cell: ({ index }) => (
        <TextField
          hideLabel={true}
          name={`sampleSrs[${index}].libraryPrep.quality`}
        />
      ),
      Header: "Quality",
      sortable: false
    },
    {
      Cell: ({ index }) => (
        <TextField
          hideLabel={true}
          name={`sampleSrs[${index}].libraryPrep.size`}
        />
      ),
      Header: "Size",
      sortable: false
    },
    // i5 and i7 cells
    ...["indexI5", "indexI7"].map(primerFieldName => ({
      Cell: ({ index, original: sr }) => (
        <ResourceSelectField<PcrPrimer>
          customDataFetch={resourceSelectLoader}
          filter={filterBy(["name"])}
          hideLabel={true}
          key={sr.id}
          model="pcrPrimer"
          name={`sampleSrs[${index}].libraryPrep.${primerFieldName}`}
          optionLabel={primer => primer.name}
          styles={{ menu: () => ({ zIndex: 5 }) }}
        />
      ),
      Header: primerFieldName,
      sortable: false
    }))
  ];

  return (
    <Formik
      enableReinitialize={true}
      initialValues={{ sampleSrs: visibleSampleSrs }}
      onSubmit={onSubmit}
    >
      <Form>
        <strong>Selected Samples</strong>
        <div className="float-right">
          <SubmitButton>Save Table Values</SubmitButton>
        </div>
        <QueryTable
          columns={COLUMNS}
          loading={libraryPrepsLoading}
          deps={[lastPrepTableSave]}
          // Filter down to the selected samples from this chain's sample selection step.
          filter={{
            "chain.chainId": chain.id,
            "chainStepTemplate.chainStepTemplateId": sampleSelectionStep.id
          }}
          include="sample"
          onSuccess={res => setVisibleSampleSrs(res.data)}
          path="stepResource"
        />
        <div className="float-right">
          <SubmitButton>Save Table Values</SubmitButton>
        </div>
      </Form>
    </Formik>
  );
}
