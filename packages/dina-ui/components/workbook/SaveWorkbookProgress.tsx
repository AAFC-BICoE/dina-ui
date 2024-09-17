import { useRouter } from "next/router";
import { useEffect, useRef, useState } from "react";
import { Button } from "react-bootstrap";
import ProgressBar from "react-bootstrap/ProgressBar";
import { useIntl } from "react-intl";
import {
  AreYouSureModal,
  rsql,
  useApiClient,
  useModal,
  useQuery
} from "../../../common-ui/lib";
import { DinaMessage, useDinaIntl } from "../../../dina-ui/intl/dina-ui-intl";
import { WorkBookSavingStatus, useWorkbookContext } from "./WorkbookProvider";
import FieldMappingConfig from "./utils/FieldMappingConfig";
import { useWorkbookConverter } from "./utils/useWorkbookConverter";
import { delay } from "./utils/workbookMappingUtils";
import { PersistedResource, KitsuResource } from "kitsu";
import { MaterialSample } from "packages/dina-ui/types/collection-api";

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
    workbookColumnMap
  } = useWorkbookContext();

  const { save, apiClient, doOperations } = useApiClient();
  const statusRef = useRef<WorkBookSavingStatus>(status ?? "CANCELED");
  const router = useRouter();
  const { formatMessage } = useDinaIntl();
  const warningText = formatMessage("leaveSaveWorkbookWarning");

  const appendDataForAllExistingResources = useRef(false);
  const { openModal } = useModal();

  const [now, setNow] = useState<number>(progress);
  const [sourceSet, setSourceSet] = useState<string>();
  const [savedResources, setSavedResources] = useState<
    PersistedResource<KitsuResource>[]
  >([]);

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
    finishSavingWorkbook(sourceSetValue ?? "");
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
    const sourceSetInternal = `wb_upload_${Date.now()}`;
    setSourceSet(sourceSetInternal);
    async function saveChunkOfWorkbook(chunkedResources) {
      for (const resource of chunkedResources) {
        resource.sourceSet = sourceSetInternal;
        let existingResource: any;

        if (resource.type === "material-sample") {
          const resp = await apiClient.get<MaterialSample[]>(
            "collection-api/material-sample",
            {
              filter: {
                rsql: `materialSampleName=="${resource?.materialSampleName}"`
              }
            }
          );
          existingResource = resp.data[0];
        }

        if (existingResource) {
          const appendDataForExisting = await openModalWithPromise(
            existingResource
          );

          // Depending on the user's response, set the `appendDataForAllExistingResources` flag
          appendDataForAllExistingResources.current = appendDataForExisting;
        }

        for (const key of Object.keys(resource)) {
          await linkRelationshipAttribute(
            resource,
            workbookColumnMap,
            key,
            group ?? "",
            appendDataForAllExistingResources.current && existingResource
              ? existingResource
              : undefined
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

    // Utility function to show the modal and stop code execution and return a Promise that resolves based on user's choice
    function openModalWithPromise(existingResource): Promise<boolean> {
      return new Promise((resolve) => {
        openModal(
          <AreYouSureModal
            actionMessage={<DinaMessage id="existingResourceFoundTitle" />}
            messageBody={
              <DinaMessage
                id="existingResourceFoundBody"
                values={{
                  existingResourceName: existingResource.materialSampleName
                }}
              />
            }
            onYesButtonClicked={() => {
              resolve(true);
            }}
            onNoButtonClicked={() => {
              resolve(false);
            }}
            yesButtonText={formatMessage("workBookAppendData")}
            noButtonText={formatMessage("workBookCreateNew")}
          />
        );
      });
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
        await saveChunkOfWorkbook(chunk);
      } catch (error) {
        statusRef.current = "FAILED";
        await failSavingWorkbook(error);
        await delay(10); // Yield to render the progress bar
        break;
      }
      const next = i + chunkSize;
      setNow(next);
      saveProgress(next);
      await delay(10); // Yield to render the progress bar
    }
    if (statusRef.current === "SAVING") {
      statusRef.current = "FINISHED";
      setNow(workbookResources.length);
      saveProgress(workbookResources.length);
      finishUpload(sourceSetInternal);
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
          rsql: `sourceSet==${sourceSet}`
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

  return (
    <>
      <ProgressBar
        min={0}
        max={workbookResources.length}
        now={now}
        label={`${now}/${workbookResources.length}`}
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
      {statusRef.current === "PAUSED" && now < workbookResources.length && (
        <div className="mt-3 text-center">
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
        </div>
      )}
    </>
  );
}
