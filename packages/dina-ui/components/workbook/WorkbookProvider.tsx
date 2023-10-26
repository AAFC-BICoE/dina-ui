import {
  deleteFromStorage,
  useLocalStorage,
  writeStorage
} from "@rehooks/local-storage";
import {
  ReactNode,
  createContext,
  useContext,
  useReducer,
  useEffect
} from "react";
import { WorkbookResourceType } from "./types/Workbook";

import db, { WorkbookDB } from "./WorkbookDB";
import { useLiveQuery } from "dexie-react-hooks";

async function saveWorkbookResources(
  type: string,
  workbookResources: WorkbookResourceType[]
) {
  const workbook = await db.workbooks.get(type);
  if (workbook) {
    await db.workbooks.put({ name: type, workbook: workbookResources });
  } else {
    await db.workbooks.add({ name: type, workbook: workbookResources });
  }
}

async function deleteWorkbookResources(type?: string) {
  if (type) {
    await db.workbooks.delete(type);
  }
}

type actionType =
  | "START_SAVING"
  | "PAUSE_SAVING"
  | "RESUME_SAVING"
  | "CANCEL_SAVING"
  | "FINISH_SAVING"
  | "SAVE_PROGRESS"
  | "RETRIEVE_WORKBOOK_FROM_STORAGE"
  | "RESET";

export type WorkBookSavingStatus =
  | "READY"
  | "SAVING"
  | "PAUSED"
  | "FINISHED"
  | "CANCELED";

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
    case "RETRIEVE_WORKBOOK_FROM_STORAGE":
      return {
        ...state,
        ...action.payload
      };
    case "CANCEL_SAVING":
      writeStorage<WorkbookMetaData>("workbookResourceMetaData", {
        status: "CANCELED",
        progress: 0
      });
      return {
        workbookResources: [],
        progress: 0,
        status: "CANCELED"
      };
    case "SAVE_PROGRESS":
      return {
        ...state,
        progress: action.payload
      };
    case "START_SAVING":
      return {
        status: "SAVING",
        progress: 0,
        workbookResources: action.payload.workbookResources,
        group: action.payload.group,
        type: action.payload.type,
        apiBaseUrl: action.payload.apiBaseUrl
      };
    case "PAUSE_SAVING":
      return {
        ...state,
        status: "PAUSED"
      };
    case "RESUME_SAVING":
      return {
        ...state,
        status: "SAVING"
      };
    case "FINISH_SAVING":
      return {
        ...state,
        status: "FINISHED",
        progress: action.payload
      };
    case "RESET":
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
  ) => Promise<void>;
  pauseSavingWorkbook: () => void;
  resumeSavingWorkbook: () => void;
  finishSavingWorkbook: () => Promise<void>;
  cancelSavingWorkbook: (type?: string) => Promise<void>;
  reset: (type?: string) => void;
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
  const initState: State = {
    workbookResources: [],
    progress: 0
  };
  const [state, dispatch] = useReducer(reducer, initState);
  useEffect(() => {
    const strMetaData = localStorage.getItem("workbookResourceMetaData");
    const workbookMetaDataInLocalStorage: WorkbookMetaData = strMetaData
      ? JSON.parse(strMetaData)
      : ({} as any);

    const type = state.type ?? workbookMetaDataInLocalStorage?.type;

    async function queryWorkbookResources(typeParam: string) {
      const found = await db.workbooks.get(typeParam);
      const result = found?.workbook ?? [];
      dispatch({
        type: "RETRIEVE_WORKBOOK_FROM_STORAGE",
        payload: {
          workbookResources: result,
          ...workbookMetaDataInLocalStorage
        }
      });
    }
    if (type) {
      queryWorkbookResources(type);
    }
  }, [state.type]);

  const saveProgress = (newProgress) => {
    writeStorage<WorkbookMetaData>("workbookResourceMetaData", {
      status: state.status,
      type: state.type,
      group: state.group,
      apiBaseUrl: state.apiBaseUrl,
      progress: newProgress
    });
    dispatch({ type: "SAVE_PROGRESS", payload: newProgress });
  };

  const startSavingWorkbook = async (
    newWorkbookResources: WorkbookResourceType[],
    newGroup: string,
    newType: string,
    newApiBaseUrl: string
  ) => {
    writeStorage<WorkbookMetaData>("workbookResourceMetaData", {
      status: "SAVING",
      group: newGroup,
      type: newType,
      apiBaseUrl: newApiBaseUrl,
      progress: 0
    });
    await saveWorkbookResources(newType, newWorkbookResources);
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
    writeStorage<WorkbookMetaData>("workbookResourceMetaData", {
      status: "PAUSED",
      group: state.group,
      type: state.type,
      apiBaseUrl: state.apiBaseUrl,
      progress: state.progress
    });
    dispatch({
      type: "PAUSE_SAVING"
    });
  };

  const resumeSavingWorkbook = () => {
    writeStorage<WorkbookMetaData>("workbookResourceMetaData", {
      status: "SAVING",
      group: state.group,
      type: state.type,
      apiBaseUrl: state.apiBaseUrl,
      progress: state.progress
    });
    dispatch({
      type: "RESUME_SAVING"
    });
  };

  const cancelSavingWorkbook = async (type?: string) => {
    await deleteWorkbookResources(type);
    dispatch({
      type: "CANCEL_SAVING"
    });
  };

  const finishSavingWorkbook = async () => {
    writeStorage<WorkbookMetaData>("workbookResourceMetaData", {
      status: "FINISHED",
      group: state.group,
      type: state.type,
      apiBaseUrl: state.apiBaseUrl,
      progress: state.progress
    });
    await deleteWorkbookResources(state.type);
    dispatch({
      type: "FINISH_SAVING"
    });
  };

  const reset = async (type?: string) => {
    await deleteWorkbookResources(type);
    deleteFromStorage("workbookResourceMetaData");
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
