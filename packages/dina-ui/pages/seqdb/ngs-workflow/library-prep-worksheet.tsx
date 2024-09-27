import { LoadingSpinner, useQuery } from "common-ui";
import { useRouter } from "next/router";
import { Head } from "packages/dina-ui/components";
import { useIndexAssignmentAPI } from "packages/dina-ui/components/seqdb/ngs-workflow/useIndexAssignmentAPI";
import {
  LibraryPrep,
  LibraryPrepBatch
} from "packages/dina-ui/types/seqdb-api";
import { noop } from "lodash";
import { StorageUnitType } from "packages/dina-ui/types/collection-api";
import { Button } from "react-bootstrap";
import { DinaMessage } from "packages/dina-ui/intl/dina-ui-intl";
import PageLayout from "packages/dina-ui/components/page/PageLayout";

export default function LibraryPrepWorksheetPage() {
  const {
    query: { batchId, sampleLayout }
  } = useRouter();

  const { loading: batchLoading, response: batchResponse } =
    useQuery<LibraryPrepBatch>({
      include: [
        "protocol",
        "thermocyclerProfile",
        "indexSet",
        "containerType"
      ].join(","),
      path: `seqdb-api/library-prep-batch/${batchId}`
    });

  const batch = batchResponse && batchResponse.data;

  if (batchLoading) {
    return <LoadingSpinner loading={true} />;
  }
  if (!batch) {
    return "wack";
  }

  return (
    <LibraryPrepWorksheetLoaded
      batch={batch}
      sampleLayout={(sampleLayout as string) ?? "table"}
    />
  );
}

interface LibraryPrepWorksheetLoadedProps {
  batch: LibraryPrepBatch;
  sampleLayout: string;
}

function LibraryPrepWorksheetLoaded({
  batch,
  sampleLayout
}: LibraryPrepWorksheetLoadedProps) {
  const { libraryPrepsLoading, libraryPreps, storageUnitType } =
    useIndexAssignmentAPI({
      batch,
      batchId: batch.id ?? "",
      editMode: true,
      onSaved: (_x, _y) => Promise.resolve(),
      performSave: false,
      setEditMode: noop,
      setPerformSave: noop
    });

  if (libraryPrepsLoading) {
    return <LoadingSpinner loading={true} />;
  }

  const buttonBarContent = (
    <>
      <Button
        variant="secondary"
        className="btn btn-primary "
        onClick={() => window.print()}
        style={{ width: "10rem" }}
      >
        <DinaMessage id="print" />
      </Button>
    </>
  );

  return (
    <PageLayout
      titleId="libraryPrepWorksheetTitle"
      buttonBarContent={buttonBarContent}
    >
      <div className="row">
        <div className="col-6">
          <HorizontalField label="Workflow" defaultValue={batch.name} />
          <HorizontalField
            label="Protocol"
            defaultValue={batch.protocol ? batch.protocol.name : ""}
          />
        </div>
        <div className="col-6">
          <HorizontalField label="Experimenter" />
          <HorizontalField label="Date" />
        </div>
      </div>
      <div style={{ height: "50px" }} />
      <div className="row">
        <div className="col-6">
          <BigField label="Notes" />
          <HorizontalField label="Thermocycler" />
        </div>
        <div className="col-6">
          <div className="row">
            <div className="col-12">
              <HorizontalField label="Pos Control" />
              <HorizontalField label="Neg Control" />
              <div className="row form-group">
                <div className="col-3">
                  <input className="form-control" />
                </div>
                <div className="col-9">
                  <strong>ul reaction mix pipetted into each tube</strong>
                </div>
              </div>
              <HorizontalField
                label="Thermocycler Profile"
                defaultValue={
                  batch.thermocyclerProfile
                    ? batch.thermocyclerProfile.name
                    : ""
                }
              />
              <div className="row">
                <div className="col-6">
                  {[...Array(6).keys()].map((i) => (
                    <HorizontalField
                      key={i}
                      label={`Step ${i + 1}`}
                      defaultValue={
                        batch?.thermocyclerProfile?.steps &&
                        batch.thermocyclerProfile.steps[`${i}`]
                      }
                    />
                  ))}
                </div>
                <div className="col-6">
                  {[...Array(6).keys()].map((i) => (
                    <HorizontalField
                      key={i}
                      label={`Step ${i + 7}`}
                      defaultValue={
                        batch?.thermocyclerProfile?.steps &&
                        batch.thermocyclerProfile.steps[`${i + 6}`]
                      }
                    />
                  ))}
                </div>
              </div>
              <HorizontalField
                label="Cycles"
                defaultValue={
                  batch.thermocyclerProfile && batch.thermocyclerProfile.cycles
                    ? batch.thermocyclerProfile.cycles
                    : ""
                }
              />
            </div>
          </div>
        </div>
      </div>
      <div className="row">
        <div className="col-12">
          <BigField label="Results and next steps" />
          {libraryPreps && libraryPreps?.length !== 0 && (
            <>
              {sampleLayout === "table" ? (
                <LibraryPrepTable
                  libraryPrepBatch={batch}
                  preps={libraryPreps}
                />
              ) : sampleLayout === "grid" ? (
                <LibraryPrepGrid
                  libraryPrepBatch={batch}
                  preps={libraryPreps}
                  storageUnitType={storageUnitType}
                />
              ) : null}
            </>
          )}
        </div>
      </div>
    </PageLayout>
  );
}

function HorizontalField({ label, defaultValue = "", disabled = true }) {
  return (
    <div className="row form-group mb-2">
      <strong className="col-3">{label}</strong>
      <div className="col-9">
        <input
          className="form-control"
          defaultValue={defaultValue}
          disabled={disabled}
        />
      </div>
    </div>
  );
}

function BigField({ label, defaultValue = "", disabled = true }) {
  return (
    <div className="row form-group mb-2">
      <div className="col-12">
        <strong>{label}</strong>
        <textarea
          className="form-control"
          defaultValue={defaultValue}
          disabled={disabled}
        />
      </div>
    </div>
  );
}

interface LibraryPrepTableProps {
  libraryPrepBatch: LibraryPrepBatch;
  preps: LibraryPrep[];
  storageUnitType?: StorageUnitType;
}

function LibraryPrepTable({ preps }: LibraryPrepTableProps) {
  return (
    <table className="table table-bordered table-sm library-prep-table">
      <thead>
        <tr>
          <th>Well Coordinates</th>
          <th>Primary ID</th>
          <th>Material Sample Version</th>
          <th>Index i5</th>
          <th>Index i7</th>
        </tr>
      </thead>
      <tbody>
        {preps.map((prep) => {
          const wellColumn = prep?.storageUnitUsage?.wellColumn;
          const wellRow = prep?.storageUnitUsage?.wellRow;
          const wellCoordinates =
            wellColumn === null || !wellRow
              ? null
              : `${wellRow}${String(wellColumn)}`;

          return (
            <tr key={String(prep.id)}>
              <td>{wellCoordinates}</td>
              <td>{prep?.materialSample?.materialSampleName}</td>
              <td>{prep?.materialSample?.version}</td>
              <td>{prep.indexI5 && prep.indexI5.name}</td>
              <td>{prep.indexI7 && prep.indexI7.name}</td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}

function LibraryPrepGrid({ preps, storageUnitType }: LibraryPrepTableProps) {
  if (!storageUnitType) {
    return null;
  }

  const cellGrid: { [key: string]: LibraryPrep } = {};
  const libraryPrepsWithCoords = preps.filter(
    (prep) => prep?.storageUnitUsage?.wellRow && prep?.storageUnitUsage?.wellRow
  );
  for (const prep of libraryPrepsWithCoords) {
    cellGrid[
      `${prep?.storageUnitUsage?.wellRow}_${prep?.storageUnitUsage?.wellRow}`
    ] = prep;
  }

  const numberOfColumns =
    storageUnitType?.gridLayoutDefinition?.numberOfColumns;
  const numberOfRows = storageUnitType?.gridLayoutDefinition?.numberOfRows;

  const rowLetters = [...Array(numberOfRows).keys()].map((num) =>
    String.fromCharCode(num + 65)
  );
  const columnNumbers = [...Array(numberOfColumns).keys()].map(
    (num) => num + 1
  );

  return (
    <table className="table table-bordered table-sm library-prep-grid">
      <tbody>
        <tr>
          <td />
          {columnNumbers.map((num) => (
            <td key={num}>{num}</td>
          ))}
        </tr>
        {rowLetters.map((rowLetter) => (
          <tr key={rowLetter}>
            <td>{rowLetter}</td>
            {columnNumbers.map((columnNumber) => {
              const prep = cellGrid[`${rowLetter}_${columnNumber}`];

              return (
                <td key={columnNumber}>
                  {prep && (
                    <div className="h-100 w-100">
                      <div>{prep?.materialSample?.materialSampleName}</div>
                      <div>
                        {prep.indexI5 && (
                          <div>
                            <strong>i5: </strong>
                            {prep.indexI5.name}
                          </div>
                        )}
                        {prep.indexI7 && (
                          <div>
                            <strong>i7: </strong>
                            {prep.indexI7.name}
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </td>
              );
            })}
          </tr>
        ))}
      </tbody>
    </table>
  );
}
