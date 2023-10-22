import { useLocalStorage, deleteFromStorage } from "@rehooks/local-storage";
import { uniq } from "lodash";
import { ReactNode, createContext, useContext, useState } from "react";
import { WorkbookResourceType } from "./types/Workbook";
import StorageUnitTypeDetailsPage from "packages/dina-ui/pages/collection/storage-unit-type/view";

export interface WorkbookUploadContextI {
  workbookResources: WorkbookResourceType[];
  progress: number;
  isSaving: boolean;
  increasProgress: (newValue: number) => void;
  isThereAnActiveUpload: () => boolean;
  cleanUp: () => void;
  apiBaseUrl?: string;
  group?: string;
  type?: string;
  startSavingWorkbook: (
    newWorkbookResources: WorkbookResourceType[],
    group: string,
    type: string,
    apiBaseUrl: string
  ) => void;
}

const WorkbookUploadContext = createContext<WorkbookUploadContextI | null>(
  null
);

export const WorkbookUploadProvider = WorkbookUploadContext.Provider;

/** Exposes the needed features from the identity provider. */
export function useWorkbookContext(): WorkbookUploadContextI {
  const ctx = useContext(WorkbookUploadContext);
  if (!ctx) {
    throw new Error("No WorkbookResourceContext available.");
  }
  return ctx;
}

/** Converts the WorkbookUploadContext to the generic WorkbookUploadContextI. */
export function WorkbookUploadContextProvider({
  children
}: {
  children: ReactNode;
}) {
  const [workbookResourcesInLocalStorage, setWorkbookResourcesInLocalStorage] =
    useLocalStorage<WorkbookResourceType[]>("workbookResourceToSave");
  const [workbookIndexInLocalStorage, setWorkbookIndexInLocalStorage] =
    useLocalStorage<number>("workbookSavingIndex");

  const [workbookResources, setWorkbookResources] = useState<
    WorkbookResourceType[]
  >(workbookResourcesInLocalStorage ?? []);

  const [progress, setProgress] = useState<number>(
    workbookIndexInLocalStorage ?? 0
  );
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const isThereAnActiveUpload = () => workbookResources.length > 0;
  const [type, setType] = useState<string>();
  const [group, setGroup] = useState<string>();

  const [apiBaseUrl, setApiBaseUrl] = useState<string>();

  const cleanUp = () => {
    setWorkbookResources([]);
    setProgress(0);
    deleteFromStorage("workbookResourceToSave");
    deleteFromStorage("workbookSavingIndex");
  };

  const increasProgress = (newProgress) => {
    setProgress(newProgress);
    setWorkbookIndexInLocalStorage(newProgress);
  };

  const startSavingWorkbook = (
    newWorkbookResources: WorkbookResourceType[],
    newGroup: string,
    newType: string,
    newApiBaseUrl: string
  ) => {
    setWorkbookIndexInLocalStorage(0);
    setWorkbookResourcesInLocalStorage(newWorkbookResources);
    setIsSaving(true);
    setProgress(0);
    setGroup(newGroup);
    setType(newType);
    setApiBaseUrl(newApiBaseUrl);
    setWorkbookResources(newWorkbookResources);
  };

  return (
    <WorkbookUploadProvider
      value={{
        workbookResources,
        progress,
        isThereAnActiveUpload,
        cleanUp,
        increasProgress,
        isSaving,
        startSavingWorkbook,
        apiBaseUrl,
        group,
        type
      }}
    >
      {children}
    </WorkbookUploadProvider>
  );
}
