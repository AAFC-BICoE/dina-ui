import {
  useLocalStorage,
  writeStorage,
  deleteFromStorage
} from "@rehooks/local-storage";
import { uniq } from "lodash";
import { ReactNode, createContext, useContext, useReducer } from "react";
import { WorkbookResourceType } from "./types/Workbook";
import StorageUnitTypeDetailsPage from "packages/dina-ui/pages/collection/storage-unit-type/view";

type actionType =
  | "START_SAVING"
  | "PAUSE_SAVING"
  | "RESUME_SAVING"
  | "CANCEL_SAVING"
  | "FINISH_SAVING"
  | "SAVE_PROGRESS"
  | "RESET";

export type WorkBookSavingStatus =
  | "READY"
  | "SAVING"
  | "PAUSED"
  | "FINISHED"
  | "CENCELED";

type State = {
  workbookResources: WorkbookResourceType[];
  progress: number;
  status?: WorkBookSavingStatus;
  type?: string;
  group?: string;
  apiBaseUrl?: string;
};

interface WorkbookMetaData {
  progress: number;
  status?: WorkBookSavingStatus;
  type?: string;
  group?: string;
  apiBaseUrl?: string;
}

const reducer = (state, action: { type: actionType; payload?: any }): State => {
  switch (action.type) {
    case "CANCEL_SAVING":
      deleteFromStorage("workbookResourceToSave");
      deleteFromStorage("workbookResourceMetaData");
      return {
        workbookResources: [],
        progress: 0,
        status: "CENCELED"
      };
    case "SAVE_PROGRESS":
      writeStorage<WorkbookMetaData>("workbookResourceMetaData", {
        status: state.status,
        type: state.type,
        group: state.group,
        apiBaseUrl: state.apiBaseUrl,
        progress: action.payload
      });
      return {
        ...state,
        progress: action.payload
      };
    case "START_SAVING":
      writeStorage<WorkbookMetaData>("workbookResourceMetaData", {
        status: "SAVING",
        group: action.payload.group,
        type: action.payload.type,
        apiBaseUrl: action.payload.apiBaseUrl,
        progress: 0
      });
      writeStorage("workbookResourceToSave", action.payload.workbookResources);
      return {
        status: "SAVING",
        progress: 0,
        workbookResources: action.payload.workbookResources,
        group: action.payload.group,
        type: action.payload.type,
        apiBaseUrl: action.payload.apiBaseUrl
      };
    case "PAUSE_SAVING":
      writeStorage<WorkbookMetaData>("workbookResourceMetaData", {
        status: "PAUSED",
        group: state.group,
        type: state.type,
        apiBaseUrl: state.apiBaseUrl,
        progress: state.progress
      });
      return {
        ...state,
        status: "PAUSED"
      };
    case "RESUME_SAVING":
      writeStorage<WorkbookMetaData>("workbookResourceMetaData", {
        status: "SAVING",
        group: state.group,
        type: state.type,
        apiBaseUrl: state.apiBaseUrl,
        progress: state.progress
      });
      return {
        ...state,
        status: "SAVING"
      };
    case "FINISH_SAVING":
      writeStorage<WorkbookMetaData>("workbookResourceMetaData", {
        status: "FINISHED",
        group: state.group,
        type: state.type,
        apiBaseUrl: state.apiBaseUrl,
        progress: state.progress
      });
      return {
        ...state,
        status: "FINISHED"
      };
    case "RESET":
      deleteFromStorage("workbookResourceToSave");
      deleteFromStorage("workbookResourceMetaData");
      return {
        workbookResources: [],
        progress: 0
      };
    default:
      return state;
  }
};

export interface WorkbookUploadContextI {
  workbookResources: WorkbookResourceType[];
  progress: number;
  status?: WorkBookSavingStatus;
  saveProgress: (newValue: number) => void;
  apiBaseUrl?: string;
  group?: string;
  type?: string;
  startSavingWorkbook: (
    newWorkbookResources: WorkbookResourceType[],
    group: string,
    type: string,
    apiBaseUrl: string
  ) => void;
  pauseSavingWorkbook: () => void;
  resumeSavingWorkbook: () => void;
  finishSavingWorkbook: () => void;
  cancelSavingWorkbook: () => void;
  reset: () => void;
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
  const [workbookMetaDataInLocalStorage, setWorkbookMetaDataInLocalStorage] =
    useLocalStorage<WorkbookMetaData>("workbookResourceMetaData");
  const initState: State = {
    workbookResources: workbookResourcesInLocalStorage ?? [],
    progress: workbookMetaDataInLocalStorage?.progress ?? 0,
    status: workbookMetaDataInLocalStorage?.status,
    apiBaseUrl: workbookMetaDataInLocalStorage?.apiBaseUrl,
    group: workbookMetaDataInLocalStorage?.group,
    type: workbookMetaDataInLocalStorage?.type
  };
  const [state, dispatch] = useReducer(reducer, initState);
  const saveProgress = (newProgress) => {
    dispatch({ type: "SAVE_PROGRESS", payload: newProgress });
  };

  const startSavingWorkbook = (
    newWorkbookResources: WorkbookResourceType[],
    newGroup: string,
    newType: string,
    newApiBaseUrl: string
  ) => {
    dispatch({
      type: "START_SAVING",
      payload: {
        workbookResources: newWorkbookResources,
        group: newGroup,
        type: newType,
        apiBaseUrl: newApiBaseUrl
      }
    });
  };

  const pauseSavingWorkbook = () => {
    dispatch({
      type: "PAUSE_SAVING"
    });
  };

  const resumeSavingWorkbook = () => {
    dispatch({
      type: "RESUME_SAVING"
    });
  };

  const cancelSavingWorkbook = () => {
    dispatch({
      type: "CANCEL_SAVING"
    });
  };

  const finishSavingWorkbook = () => {
    dispatch({
      type: "FINISH_SAVING"
    });
  };

  const reset = () => {
    dispatch({
      type: "RESET"
    });
  };

  return (
    <WorkbookUploadProvider
      value={{
        workbookResources: state.workbookResources,
        progress: state.progress,
        type: state.type,
        group: state.group,
        apiBaseUrl: state.apiBaseUrl,
        status: state.status,
        saveProgress,
        startSavingWorkbook,
        pauseSavingWorkbook,
        resumeSavingWorkbook,
        finishSavingWorkbook,
        cancelSavingWorkbook,
        reset
      }}
    >
      {children}
    </WorkbookUploadProvider>
  );
}
