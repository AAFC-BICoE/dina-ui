import { HotColumnProps } from "@handsontable/react";
import {
  ApiClientContext,
  BulkDataEditor,
  decodeResourceCell,
  DinaForm,
  encodeResourceCell,
  filterBy,
  RowChange,
  SaveArgs,
  useResourceSelectCells
} from "common-ui";
import { GroupSelectField } from "../../../../../dina-ui/components/group-select/GroupSelectField";
import { useContext } from "react";
import { SeqdbMessage, useSeqdbIntl } from "../../../../intl/seqdb-intl";
import {
  Chain,
  ChainStepTemplate,
  LibraryPrep,
  LibraryPrepBatch,
  MolecularSample,
  NgsIndex,
  StepResource
} from "../../../../types/seqdb-api";

type LibraryPrepEditMode = "DETAILS" | "INDEX";

interface SampleStepResource extends StepResource {
  molecularSample: MolecularSample;
}

interface LibraryPrepBulkEditRow {
  indexI5?: string;
  indexI7?: string;
  molecularSample: MolecularSample;
  libraryPrep: LibraryPrep;

  /** Read-only wellCoordinates column: */
  wellCoordinates?: string;
}

export interface LibraryPrepBulkEditorProps {
  chain: Chain;
  editMode: LibraryPrepEditMode;
  libraryPrepBatch: LibraryPrepBatch;
  sampleSelectionStep: ChainStepTemplate;
}

export function LibraryPrepBulkEditor({
  chain,
  editMode,
  libraryPrepBatch,
  sampleSelectionStep
}: LibraryPrepBulkEditorProps) {
  const { apiClient, save } = useContext(ApiClientContext);
  const { formatMessage } = useSeqdbIntl();
  const resourceSelectCell = useResourceSelectCells();

  const COLUMNS: HotColumnProps[] = [
    {
      data: "molecularSample.name",
      title: formatMessage("field_sample.name"),
      width: 300,
      readOnly: true
    },
    ...(editMode === "DETAILS"
      ? [
          {
            data: "libraryPrep.inputNg",
            title: formatMessage("field_inputNg"),
            width: 300
          },
          {
            data: "libraryPrep.quality",
            title: formatMessage("field_quality"),
            width: 300
          },
          {
            data: "libraryPrep.size",
            title: formatMessage("field_size"),
            width: 300
          }
        ]
      : []),
    ...(editMode === "INDEX"
      ? [
          {
            data: "wellCoordinates",
            title: formatMessage("wellCoordinates"),
            readOnly: true,
            width: 150
          },
          ...(["indexI5", "indexI7"] as ("indexI5" | "indexI7")[]).map(
            indexField =>
              resourceSelectCell<NgsIndex>(
                {
                  filter: filterBy(["name"]),
                  label: ngsIndex => ngsIndex.name,
                  model: `seqdb-api/index-set/${libraryPrepBatch.indexSet?.id}/ngsIndexes`,
                  type: "ngs-index"
                },
                {
                  data: `${indexField}`,
                  title: formatMessage(indexField),
                  width: 300
                }
              )
          )
        ]
      : [])
  ];

  async function loadData(): Promise<LibraryPrepBulkEditRow[]> {
    // Load the StepResources of the Sample Select step.
    // There should be one table row per StepResource (selected Sample).
    const { data: sampleSrs } = await apiClient.get<SampleStepResource[]>(
      "seqdb-api/step-resource",
      {
        fields: {
          "molecular-sample": "name"
        },
        filter: {
          "chain.uuid": chain.id as string,
          "chainStepTemplate.uuid": sampleSelectionStep.id as string
        },
        include: "molecularSample",
        page: { limit: 1000 }
      }
    );

    // Fetch the existing LibraryPreps for this LibraryPrepBatch:
    const { data: libraryPreps } = await apiClient.get<LibraryPrep[]>(
      `seqdb-api/library-prep-batch/${libraryPrepBatch.id}/libraryPreps`,
      {
        include: "molecularSample,indexI5,indexI7",
        page: { limit: 1000 }
      }
    );

    const rows = sampleSrs.map<LibraryPrepBulkEditRow>(
      ({ molecularSample }) => {
        // Join the LibraryPreps to the StepResources:
        const libraryPrep =
          libraryPreps.find(
            prep => prep.molecularSample.id === molecularSample.id
          ) ?? ({} as LibraryPrep);

        const { wellColumn, wellRow } = libraryPrep;
        const wellCoordinates =
          wellColumn === null || !wellRow
            ? undefined
            : `${wellRow}${String(wellColumn).padStart(2, "0")}`;

        return {
          libraryPrep,
          indexI5: encodeResourceCell(libraryPrep.indexI5, {
            label: libraryPrep.indexI5?.name
          }),
          indexI7: encodeResourceCell(libraryPrep.indexI7, {
            label: libraryPrep.indexI7?.name
          }),
          molecularSample,
          wellCoordinates
        };
      }
    );

    return rows;
  }

  async function onSubmit(changes: RowChange<LibraryPrepBulkEditRow>[]) {
    const saves = changes.map<SaveArgs>(change => {
      const id = change.original.libraryPrep?.id;

      const libraryPrepEdit = {
        type: "library-prep",
        ...(id ? { id } : {}),
        libraryPrepBatch,
        molecularSample: change.original.molecularSample,
        ...change.changes.libraryPrep
      } as LibraryPrep;

      // Set the indexes if they were changed:
      const { indexI5, indexI7 } = change.changes;
      if (indexI5 !== undefined) {
        libraryPrepEdit.indexI5 = decodeResourceCell(indexI5) as NgsIndex;
      }
      if (indexI7 !== undefined) {
        libraryPrepEdit.indexI7 = decodeResourceCell(indexI7) as NgsIndex;
      }

      return {
        resource: libraryPrepEdit,
        type: "library-prep"
      };
    });

    // Send the batch edit API request:
    await save(saves, { apiBaseUrl: "/seqdb-api" });
  }

  // Don't allow index mode if the index set is not set:
  if (editMode === "INDEX" && !libraryPrepBatch.indexSet) {
    return (
      <div className="alert alert-warning">
        <SeqdbMessage id="indexSetMustBeSet" />
      </div>
    );
  }

  return (
    <DinaForm initialValues={{}}>
      <strong>
        <SeqdbMessage id="editableTable" />:
      </strong>
      <BulkDataEditor<LibraryPrepBulkEditRow>
        columns={COLUMNS}
        loadData={loadData}
        onSubmit={onSubmit}
      />
    </DinaForm>
  );
}
