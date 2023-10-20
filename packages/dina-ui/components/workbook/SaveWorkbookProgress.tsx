import { useRouter } from "next/router";
import { useApiClient } from "packages/common-ui/lib";
import { DinaMessage } from "packages/dina-ui/intl/dina-ui-intl";
import { useEffect, useRef, useState } from "react";
import { Button } from "react-bootstrap";
import ProgressBar from "react-bootstrap/ProgressBar";
import { useIntl } from "react-intl";
import { useWorkbookContext } from "./WorkbookProvider";
import FieldMappingConfig from "./utils/FieldMappingConfig";
import { useWorkbookConverter } from "./utils/useWorkbookConverter";

const delay = async (ms) => new Promise((resolve) => setTimeout(resolve, ms));

export interface SaveWorkbookProgressProps {
  onWorkbookSaved: () => void;
}

export function SaveWorkbookProgress({
  onWorkbookSaved
}: SaveWorkbookProgressProps) {
  const {
    isSaving,
    progress,
    workbookResources,
    cleanUp,
    increasProgress,
    group,
    type,
    apiBaseUrl
  } = useWorkbookContext();

  const { save } = useApiClient();
  const isSavingRef = useRef(isSaving);
  const router = useRouter();
  const { formatMessage } = useIntl();
  const warningText = formatMessage({ id: "leaveSaveWorkbookWarning" });

  const [now, setNow] = useState<number>(progress);

  const isSafeToLeave = () => {
    return (
      !isSavingRef.current ||
      workbookResources.length === 0 ||
      now === workbookResources.length
    );
  };

  const finishUpload = () => {
    cleanUp();
    onWorkbookSaved?.();
  };

  const { linkRelationshipAttribute } = useWorkbookConverter(
    FieldMappingConfig,
    workbookResources?.[0].type || "material-sample"
  );

  useEffect(() => {
    const handleWindowClose = (e) => {
      if (isSafeToLeave()) {
        if (now === workbookResources.length) {
          finishUpload();
        }
        return;
      }
      e.preventDefault();
      return (e.returnValue = warningText);
    };
    const handleBrowseAway = () => {
      if (isSafeToLeave()) {
        if (now === workbookResources.length) {
          finishUpload();
        }
        return;
      }
      if (window.confirm(warningText)) {
        isSavingRef.current = false;
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
    saveWorkbook();
  }, []);

  function saveWorkbook() {
    async function asyncSave(chunkedResources) {
      for (const resource of chunkedResources) {
        for (const key of Object.keys(resource)) {
          if (resource[key] !== undefined && resource[key] !== null) {
            await linkRelationshipAttribute(resource, key, group ?? "");
          }
        }
      }
      await save(chunkedResources, { apiBaseUrl });
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
      let i = 0;
      i < workbookResources.length && isSavingRef.current;
      i += chunkSize
    ) {
      const chunk = workbookResources.slice(i, i + chunkSize);
      asyncSave(chunk);
      setNow(i + 1);
      increasProgress(i + 1);
      delay(200); // Yield to render the progress bar
    }
    setNow(workbookResources.length);
    increasProgress(workbookResources.length);
    isSavingRef.current = false;
  }

  return (
    <>
      <ProgressBar
        min={0}
        max={workbookResources.length}
        now={now}
        label={`${now}/${workbookResources.length}`}
      />
      {workbookResources.length > 0 && now === workbookResources.length && (
        <div className="mt-3 text-center">
          <p>
            <DinaMessage id="uploadWorkbookIsDone" />
          </p>
          <Button className="mt-1 mb-2" onClick={() => finishUpload()}>
            OK
          </Button>
        </div>
      )}
      {isSavingRef.current === false && now < workbookResources.length && (
        <div className="mt-3 text-center">
          <p>
            <DinaMessage id="confirmToResumeSavingWorkbook" />
          </p>
          <Button
            className="mt-1 mb-2 btn"
            onClick={() => {
              isSavingRef.current = true;
              saveWorkbook();
            }}
          >
            <DinaMessage id="yes" />
          </Button>
          <Button
            variant="secondary"
            className="mt-1 mb-2 ms-4"
            onClick={() => cleanUp()}
          >
            <DinaMessage id="no" />
          </Button>
        </div>
      )}
    </>
  );
}
