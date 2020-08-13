import {
  ApiClientContext,
  ErrorViewer,
  filterBy,
  NumberField,
  ResourceSelectField,
  safeSubmit,
  SubmitButton,
  TextField,
  useCacheableQueryLoader,
  useQuery
} from "common-ui";
import { Form, Formik } from "formik";
import { cloneDeep, isEqual } from "lodash";
import { useContext, useState } from "react";
import ReactTable, { Column } from "react-table";
import titleCase from "title-case";
import {
  Chain,
  ChainStepTemplate,
  LibraryPrep,
  LibraryPrepBatch,
  NgsIndex,
  Sample,
  StepResource
} from "../../../types/seqdb-api";

type LibraryPrepEditMode = "DETAILS" | "INDEX";

interface SampleStepResource extends StepResource {
  sample: Sample;
}

export interface LibraryPrepEditTableProps {
  chain: Chain;
  libraryPrepBatch: LibraryPrepBatch;
  sampleSelectionStep: ChainStepTemplate;
  editMode: LibraryPrepEditMode;
}

export function LibraryPrepEditTable({
  chain,
  editMode,
  libraryPrepBatch,
  sampleSelectionStep
}: LibraryPrepEditTableProps) {
  const { save } = useContext(ApiClientContext);
  const resourceSelectLoader = useCacheableQueryLoader();

  // Current sample StepResources in the "sample selection" table.
  const [sampleSrs, setSampleSrs] = useState<SampleStepResource[]>([]);

  // Timestamp of the last table save.
  const [lastPrepTableSave, setLastPrepTableSave] = useState<number>();

  // The values to initialize the Formik form.
  const [formikValues, setFormikValues] = useState({
    sampleSrs: [] as SampleStepResource[]
  });

  // Query the libraryPreps of this batch.
  const { loading: libraryPrepsLoading } = useQuery<LibraryPrep[]>(
    {
      // Optimize query speed by reducing the amount of requested fields.
      fields: {
        ngsIndex: "name",
        sample: "name"
      },
      include: "sample,indexI5,indexI7",
      page: { limit: 1000 },
      path: `seqdb-api/libraryPrepBatch/${libraryPrepBatch.id}/libraryPreps`
    },
    {
      // Run this query whenever there is a new set of sample StepResources.
      deps: [sampleSrs],
      onSuccess: ({ data: libraryPreps }) => {
        // Attach the libraryPreps to the samples.
        for (const sampleSr of sampleSrs) {
          const libraryPrepForThisSample = libraryPreps.find(
            libraryPrep => libraryPrep.sample.id === sampleSr.sample.id
          );

          if (libraryPrepForThisSample) {
            sampleSr.libraryPrep = libraryPrepForThisSample;
          }
        }

        // Re-initialize formik form.
        setFormikValues({ sampleSrs: cloneDeep(sampleSrs) });
      }
    }
  );

  const { loading: sampleSrsLoading } = useQuery<SampleStepResource[]>(
    {
      fields: {
        sample: "name"
      },
      filter: {
        "chain.chainId": chain.id as string,
        "chainStepTemplate.chainStepTemplateId": sampleSelectionStep.id as string
      },
      include: "sample",
      page: { limit: 1000 },
      path: "seqdb-api/stepResource"
    },
    {
      deps: [lastPrepTableSave],
      onSuccess: res => setSampleSrs(res.data)
    }
  );

  if (!libraryPrepBatch.indexSet || !libraryPrepBatch.containerType) {
    return (
      <span className="alert alert-warning">
        Index set and container type must be set to edit library preps.
      </span>
    );
  }

  const onSubmit = safeSubmit(async submittedValues => {
    const submittedSampleSrs: SampleStepResource[] = submittedValues.sampleSrs;

    const touchedSampleSrs: SampleStepResource[] = [];
    for (const i in submittedSampleSrs) {
      if (!isEqual(submittedSampleSrs[i], sampleSrs[i])) {
        touchedSampleSrs.push(submittedSampleSrs[i]);
      }
    }

    const libraryPreps: LibraryPrep[] = [];
    for (const submittedSr of touchedSampleSrs) {
      if (submittedSr.libraryPrep) {
        submittedSr.libraryPrep.sample = submittedSr.sample;
        submittedSr.libraryPrep.libraryPrepBatch = libraryPrepBatch;
        libraryPreps.push(submittedSr.libraryPrep);
      }
    }

    const saveArgs = libraryPreps.map(resource => ({
      resource,
      type: "libraryPrep"
    }));

    await save(saveArgs, { apiBaseUrl: "/seqdb-api" });

    setLastPrepTableSave(Date.now());
  });

  const COLUMNS: Column<StepResource>[] =
    editMode === "DETAILS"
      ? [
          {
            Header: "Sample Name",
            accessor: "sample.name"
          },
          // Library prep fields
          {
            Cell: ({ index, original }) => (
              <NumberField
                hideLabel={true}
                key={original.id}
                name={`sampleSrs[${index}].libraryPrep.inputNg`}
              />
            ),
            Header: "Input (ng)",
            sortable: false
          },
          {
            Cell: ({ index, original }) => (
              <TextField
                hideLabel={true}
                key={original.id}
                name={`sampleSrs[${index}].libraryPrep.quality`}
              />
            ),
            Header: "Quality",
            sortable: false
          },
          {
            Cell: ({ index, original }) => (
              <TextField
                hideLabel={true}
                key={original.id}
                name={`sampleSrs[${index}].libraryPrep.size`}
              />
            ),
            Header: "Size",
            sortable: false
          }
        ]
      : editMode === "INDEX"
      ? [
          {
            Cell: ({ original: sr }) => {
              const { libraryPrep } = sr as StepResource;
              if (!libraryPrep) {
                return null;
              }

              const { wellColumn, wellRow } = libraryPrep;
              const wellCoordinates =
                wellColumn === null || !wellRow
                  ? null
                  : `${wellRow}${String(wellColumn).padStart(2, "0")}`;

              return wellCoordinates;
            },
            Header: "Well Coordinates",
            sortable: false
          },
          {
            Header: "Sample Name",
            accessor: "sample.name"
          },
          ...["indexI5", "indexI7"].map(fieldName => ({
            Cell: ({ index, original }) =>
              libraryPrepBatch.indexSet && (
                <ResourceSelectField<NgsIndex>
                  customDataFetch={resourceSelectLoader}
                  hideLabel={true}
                  filter={filterBy(["name"])}
                  key={original.id}
                  name={`sampleSrs[${index}].libraryPrep.${fieldName}`}
                  optionLabel={ngsIndex => ngsIndex.name}
                  model={`seqdb-api/indexSet/${libraryPrepBatch.indexSet.id}/ngsIndexes`}
                  styles={{ menu: () => ({ zIndex: 5 }) }}
                />
              ),
            Header: titleCase(fieldName),
            sortable: false
          }))
        ]
      : [];

  return (
    <Formik
      enableReinitialize={true}
      initialValues={formikValues}
      onSubmit={onSubmit}
    >
      <Form translate={undefined}>
        <ErrorViewer />
        <div className="row">
          <div className="col-12">
            <strong>Selected Samples</strong>
            <div className="float-right">
              <SubmitButton>Save Table Values</SubmitButton>
            </div>
          </div>
        </div>
        <div className="row">
          <div className="col-12">
            <ReactTable
              columns={COLUMNS}
              data={formikValues.sampleSrs}
              loading={libraryPrepsLoading || sampleSrsLoading}
              showPagination={false}
              pageSize={sampleSrs.length}
            />
          </div>
        </div>
        <div className="row">
          <div className="col-12">
            <div className="float-right">
              <SubmitButton>Save Table Values</SubmitButton>
            </div>
          </div>
        </div>
      </Form>
    </Formik>
  );
}
