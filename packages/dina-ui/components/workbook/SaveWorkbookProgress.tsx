import { useRouter } from "next/router";
import { useEffect, useRef, useState } from "react";
import { Button } from "react-bootstrap";
import ProgressBar from "react-bootstrap/ProgressBar";
import { useIntl } from "react-intl";
import { useApiClient } from "../../../common-ui/lib";
import { DinaMessage } from "../../../dina-ui/intl/dina-ui-intl";
import { WorkBookSavingStatus, useWorkbookContext } from "./WorkbookProvider";
import FieldMappingConfig from "./utils/FieldMappingConfig";
import { useWorkbookConverter } from "./utils/useWorkbookConverter";
import { delay } from "./utils/workbookMappingUtils";

export interface SaveWorkbookProgressProps {
  onWorkbookSaved: () => void;
  onWorkbookCanceled: () => void;
  onWorkbookFailed: () => void;
}

export function SaveWorkbookProgress({
  onWorkbookSaved,
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

  const { save } = useApiClient();
  const statusRef = useRef<WorkBookSavingStatus>(status ?? "CANCELED");
  const router = useRouter();
  const { formatMessage } = useIntl();
  const warningText = formatMessage({ id: "leaveSaveWorkbookWarning" });

  const [now, setNow] = useState<number>(progress);

  const isSafeToLeave = () => {
    return (
      !statusRef.current ||
      statusRef.current === "FINISHED" ||
      statusRef.current === "FAILED" ||
      workbookResources.length === 0 ||
      now === workbookResources.length
    );
  };

  const finishUpload = () => {
    finishSavingWorkbook();
    onWorkbookSaved?.();
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
    const sourceSet = `wb_upload_${Date.now()}`;
    async function saveChunkOfWorkbook(chunkedResources) {
      for (const resource of chunkedResources) {
        for (const key of Object.keys(resource)) {
          resource.sourceSet = sourceSet;
          await linkRelationshipAttribute(
            resource,
            workbookColumnMap,
            key,
            group ?? ""
          );
        }
      }
      await save(
        chunkedResources.map(
          (item) =>
            ({
              resource: item,
              type
            } as any)
        ),
        { apiBaseUrl }
      );
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
    }
  }

  function pause() {
    statusRef.current = "PAUSED";
    pauseSavingWorkbook();
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
      {statusRef.current === "FINISHED" &&
        workbookResources.length > 0 &&
        now >= workbookResources.length && (
          <div className="mt-3 text-center">
            <p>
              <DinaMessage id="uploadWorkbookIsDone" />
            </p>
            <Button className="mt-1 mb-2" onClick={() => finishUpload()}>
              OK
            </Button>
          </div>
        )}

      {statusRef.current === "FAILED" && (
        <div className="mt-3 text-center">
          <p className="text-start">{`Error: ${error?.message}`}</p>
          <Button className="mt-1 mb-2" onClick={() => onWorkbookFailed?.()}>
            OK
          </Button>
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
