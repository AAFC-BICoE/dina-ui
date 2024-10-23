import { useRouter } from "next/router";
import { useEffect, useRef, useState } from "react";
import { Button } from "react-bootstrap";
import ProgressBar from "react-bootstrap/ProgressBar";
import { dateCell, QueryTable, useApiClient } from "../../../common-ui/lib";
import { DinaMessage, useDinaIntl } from "../../../dina-ui/intl/dina-ui-intl";
import { WorkBookSavingStatus, useWorkbookContext } from "./WorkbookProvider";
import FieldMappingConfig from "./utils/FieldMappingConfig";
import { useWorkbookConverter } from "./utils/useWorkbookConverter";
import { delay } from "./utils/workbookMappingUtils";
import { PersistedResource, KitsuResource } from "kitsu";
import { MaterialSample } from "../../types/collection-api";
import Link from "next/link";

export interface SaveWorkbookProgressProps {
  onWorkbookCanceled: () => void;
  onWorkbookFailed: () => void;
}

export function SaveWorkbookProgress({
  onWorkbookCanceled,
  onWorkbookFailed
}: SaveWorkbookProgressProps) {
  const {
    workbookResources,
    progress,
    group,
    type,
    apiBaseUrl,
    status,
    saveProgress,
    error,
    pauseSavingWorkbook,
    resumeSavingWorkbook,
    finishSavingWorkbook,
    cancelSavingWorkbook,
    failSavingWorkbook,
    workbookColumnMap,
    appendData
  } = useWorkbookContext();

  const { save, apiClient, doOperations } = useApiClient();
  const statusRef = useRef<WorkBookSavingStatus>(status ?? "CANCELED");
  const router = useRouter();
  const { formatMessage } = useDinaIntl();
  const warningText = formatMessage("leaveSaveWorkbookWarning");

  const [now, setNow] = useState<number>(progress);
  const sourceSet = useRef<string | undefined>(undefined);
  const [savedResources, setSavedResources] = useState<
    PersistedResource<KitsuResource>[]
  >([]);
  const existingResources = useRef<any[]>([]);
  const existingResource = useRef<any>(undefined);

  const resourcesUpdatedCount = useRef<number>(0);

  const isSafeToLeave = () => {
    return (
      !statusRef.current ||
      statusRef.current === "FINISHED" ||
      statusRef.current === "FAILED" ||
      workbookResources.length === 0 ||
      now === workbookResources.length
    );
  };

  const finishUpload = (sourceSetValue?: string) => {
    finishSavingWorkbook(sourceSetValue ?? "", resourcesUpdatedCount.current);
  };

  const { linkRelationshipAttribute } = useWorkbookConverter(
    FieldMappingConfig,
    workbookResources?.[0].type || "material-sample"
  );

  useEffect(() => {
    const handleWindowClose = (e) => {
      if (isSafeToLeave()) {
        if (
          statusRef.current === "FINISHED" ||
          statusRef.current === "FAILED"
        ) {
          finishUpload();
        }
        return;
      }
      e.preventDefault();
      return (e.returnValue = warningText);
    };
    const handleBrowseAway = () => {
      if (isSafeToLeave()) {
        if (
          statusRef.current === "FINISHED" ||
          statusRef.current === "FAILED"
        ) {
          finishUpload();
        }
        return;
      }
      if (window.confirm(warningText)) {
        statusRef.current = "PAUSED";
        pauseSavingWorkbook();
        return;
      }
      router.events.emit("routeChangeError");
      throw new Error("routeChange aborted.");
    };
    window.addEventListener("beforeunload", handleWindowClose);
    router.events.on("routeChangeStart", handleBrowseAway);
    return () => {
      window.removeEventListener("beforeunload", handleWindowClose);
      router.events.off("routeChangeStart", handleBrowseAway);
    };
  }, [workbookResources]);

  useEffect(() => {
    (() => saveWorkbook())();
  }, []);

  async function saveWorkbook() {
    if (!sourceSet.current) {
      sourceSet.current = `wb_upload_${Date.now()}`;
    }

    async function saveChunkOfWorkbook(chunkedResources, progressInternal) {
      let i = 0;
      for (const resource of chunkedResources) {
        resource.sourceSet = sourceSet.current;
        i += 1;
        progressInternal += 1;

        // Handle appendData logic
        if (!existingResource.current) {
          // There was no existingResource cached from user clicking the Select button from table
          if (appendData && resource.type === "material-sample") {
            // In appendData mode, fetch resources that might have matching names
            const resp = await apiClient.get<MaterialSample[]>(
              "collection-api/material-sample",
              {
                filter: {
                  rsql: `materialSampleName=="${resource?.materialSampleName}";group==${group}`
                }
              }
            );

            // If multiple resources with matching names, pause upload and display table to user to select resource to append to
            if (resp.data.length > 1) {
              existingResources.current = resp.data;

              // Save the chunkedResources up until current resource in the chunk before pausing
              for (const key of Object.keys(resource)) {
                await linkRelationshipAttribute(
                  resource,
                  workbookColumnMap,
                  key,
                  group ?? ""
                );
              }
              const savedSoFar = await save(
                chunkedResources.slice(0, i - 1).map(
                  (item) =>
                    ({
                      resource: item,
                      type
                    } as any)
                ),
                { apiBaseUrl }
              );
              setSavedResources([...savedResources, ...savedSoFar]);
              setNow(progressInternal - 1);
              saveProgress(progressInternal - 1);
              await delay(10); // Yield to render the progress bar
              pause();
              return;
            } else {
              // Else Only one resource with matching name, append data to resource
              if (resp.data[0]) {
                resource.id = resp.data[0].id;
                resourcesUpdatedCount.current =
                  resourcesUpdatedCount.current + 1;
              }
            }
          }
        } else {
          // There was a cached existingResource selected by user, append data to resource selected by user
          resource.id = existingResource.current.id;
          resourcesUpdatedCount.current = resourcesUpdatedCount.current + 1;
          existingResource.current = undefined;
        }

        for (const key of Object.keys(resource)) {
          await linkRelationshipAttribute(
            resource,
            workbookColumnMap,
            key,
            group ?? ""
          );
        }
      }

      const savedArgs = await save(
        chunkedResources.map(
          (item) =>
            ({
              resource: item,
              type
            } as any)
        ),
        { apiBaseUrl }
      );
      setSavedResources([...savedResources, ...savedArgs]);
    }

    // Split big array into small chunks, which chunk size is 5.
    // Save very 5 records once.
    const chunkSize = 5;
    for (
      let i = now;
      i < workbookResources.length && statusRef.current === "SAVING";
      i += chunkSize
    ) {
      const chunk = workbookResources.slice(i, i + chunkSize);

      try {
        await saveChunkOfWorkbook(chunk, i);
      } catch (error) {
        statusRef.current = "FAILED";
        await failSavingWorkbook(error);
        await delay(10); // Yield to render the progress bar
        break;
      }
      if (statusRef.current === "SAVING") {
        const next = i + chunkSize;
        setNow(next);
        saveProgress(next);
        await delay(10); // Yield to render the progress bar
      }
    }
    if (statusRef.current === "SAVING") {
      statusRef.current = "FINISHED";
      setNow(workbookResources.length);
      saveProgress(workbookResources.length);
      finishUpload(sourceSet.current);
    }
  }

  function pause() {
    statusRef.current = "PAUSED";
    pauseSavingWorkbook();
  }

  async function deleteFailedImport() {
    const fetchedMaterialSamples = await apiClient.get<MaterialSample[]>(
      "/collection-api/material-sample",
      {
        include: "collectingEvent",
        filter: {
          rsql: `sourceSet==${sourceSet.current}`
        }
      }
    );
    const collectingEventIds = fetchedMaterialSamples?.data
      .map((materialSample) => materialSample.collectingEvent?.id)
      .filter((collectingEventId) => collectingEventId !== undefined);
    const materialSampleIds = fetchedMaterialSamples?.data.map(
      (materialSample) => materialSample.id
    );
    await doOperations(
      materialSampleIds.map((id) => ({
        op: "DELETE",
        path: `material-sample/${id}`
      })),
      { apiBaseUrl }
    );
    await doOperations(
      collectingEventIds.map((id) => ({
        op: "DELETE",
        path: `collecting-event/${id}`
      })),
      { apiBaseUrl, returnNullForMissingResource: true }
    );

    onWorkbookFailed?.();
  }

  const appendExistingDataColumns = [
    {
      cell: ({
        row: {
          original: { id, materialSampleName, dwcOtherCatalogNumbers }
        }
      }) => (
        <Link
          href={`/collection/material-sample/view?id=${id}`}
          passHref={true}
        >
          <a target="_blank">
            {materialSampleName || dwcOtherCatalogNumbers?.join?.(", ") || id}
          </a>
        </Link>
      ),
      accessorKey: "materialSampleName"
    },
    {
      cell: ({
        row: {
          original: { id }
        }
      }) => id,
      accessorKey: "id"
    },
    "createdBy",
    dateCell("createdOn"),
    {
      cell: ({ row: { original } }) => (
        <Button
          className="btn btn-primary select-sample"
          onClick={() => {
            existingResource.current = original;
            statusRef.current = "SAVING";
            resumeSavingWorkbook();
            saveWorkbook();
          }}
        >
          <DinaMessage id="selectAndResume" />
        </Button>
      ),
      size: 250,
      accessorKey: "select",
      enableSorting: false
    }
  ];

  return (
    <>
      <ProgressBar
        min={0}
        max={workbookResources.length}
        now={progress}
        label={`${progress}/${workbookResources.length}`}
      />
      {statusRef.current === "SAVING" && (
        <div className="mt-3 text-center">
          <Button className="mt-1 mb-2" onClick={() => pause()}>
            <DinaMessage id="pause" />
          </Button>
        </div>
      )}

      {statusRef.current === "FAILED" && (
        <div className="mt-3 text-center">
          <p className="text-start">{`Error: ${error?.message}`}</p>
          <Button
            className="mt-1 mb-2 me-2"
            onClick={() => onWorkbookFailed?.()}
          >
            OK
          </Button>
          {!!savedResources.length && (
            <Button className="mt-1 mb-2" onClick={deleteFailedImport}>
              <DinaMessage id="deleteFailedImport" />
            </Button>
          )}
        </div>
      )}
      {statusRef.current === "PAUSED" &&
        progress < workbookResources.length && (
          <div className="mt-3 text-center">
            {existingResources.current.length > 0 ? (
              <div>
                <p>
                  <DinaMessage id="appendDataSelectExistingResource" />
                </p>
                <QueryTable<any>
                  filter={{
                    rsql: `materialSampleName=="${existingResources.current?.[0].materialSampleName}";group==${group}`
                  }}
                  path={"collection-api/material-sample"}
                  columns={appendExistingDataColumns}
                  defaultSort={[{ desc: true, id: "createdOn" }]}
                />
              </div>
            ) : (
              <>
                {" "}
                <p>
                  <DinaMessage id="confirmToResumeSavingWorkbook" />
                </p>
                <Button
                  className="mt-1 mb-2 btn"
                  onClick={() => {
                    statusRef.current = "SAVING";
                    resumeSavingWorkbook();
                    saveWorkbook();
                  }}
                >
                  <DinaMessage id="yes" />
                </Button>
                <Button
                  variant="secondary"
                  className="mt-1 mb-2 ms-4"
                  onClick={() => {
                    statusRef.current = "CANCELED";
                    cancelSavingWorkbook(type);
                    onWorkbookCanceled?.();
                  }}
                >
                  <DinaMessage id="no" />
                </Button>
              </>
            )}
          </div>
        )}
    </>
  );
}
