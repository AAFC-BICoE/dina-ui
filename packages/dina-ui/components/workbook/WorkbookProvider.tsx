import { deleteFromStorage, writeStorage } from "@rehooks/local-storage";
import {
  ReactNode,
  createContext,
  useContext,
  useEffect,
  useReducer
} from "react";
import {
  ColumnUniqueValues,
  WorkbookColumnMap,
  WorkbookJSON,
  WorkbookResourceType
} from "./types/Workbook";

import db from "./WorkbookDB";
import { calculateColumnUniqueValuesFromSpreadsheetData } from "./utils/workbookMappingUtils";

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

async function clearWorkbookResources() {
  await db.workbooks.clear();
}

type actionType =
  | "UPLOAD_SPREADSHEET_DATA"
  | "START_SAVING"
  | "PAUSE_SAVING"
  | "RESUME_SAVING"
  | "CANCEL_SAVING"
  | "FINISH_SAVING"
  | "FAIL_SAVING"
  | "SAVE_PROGRESS"
  | "RESET"
  | "RETRIEVE_WORKBOOK_FROM_STORAGE"
  | "SET_COLUMN_MAP";


export type WorkBookSavingStatus =
  | "READY"
  | "SAVING"
  | "PAUSED"
  | "FINISHED"
  | "CANCELED"
  | "FAILED";

type State = {
  spreadsheetData?: WorkbookJSON;
  columnUniqueValues?: ColumnUniqueValues;
  workbookResources: WorkbookResourceType[];
  workbookColumnMap: WorkbookColumnMap;
  progress: number;
  status?: WorkBookSavingStatus;
  type?: string;
  group?: string;
  apiBaseUrl?: string;
  error?: Error;
};

interface WorkbookMetaData {
  progress: number;
  status?: WorkBookSavingStatus;
  type?: string;
  group?: string;
  apiBaseUrl?: string;
  error?: Error;
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
        workbookColumnMap: {},
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
        ...state,
        status: "SAVING",
        progress: 0,
        workbookResources: action.payload.workbookResources,
        group: action.payload.group,
        type: action.payload.type,
        apiBaseUrl: action.payload.apiBaseUrl
      };
    case "FAIL_SAVING":
      return {
        ...state,
        status: "FAILED",
        error: action.payload
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
        workbookColumnMap: {},
        workbookResources: [],
        progress: 0
      };
    case "UPLOAD_SPREADSHEET_DATA":
      const spreadsheetData: WorkbookJSON = action.payload;
      const columnUniqueValues: ColumnUniqueValues =
        calculateColumnUniqueValuesFromSpreadsheetData(spreadsheetData);
      return {
        spreadsheetData,
        columnUniqueValues,
        workbookResources: [],
        workbookColumnMap: {},
        progress: 0
      };
    case "SET_COLUMN_MAP":
      const newState = {
        ...state,
        workbookColumnMap: {...state.workbookColumnMap, ...action.payload}
      }
      return newState;
    default:
      return state;
  }
};

export interface WorkbookUploadContextI {
  spreadsheetData?: WorkbookJSON;
  columnUniqueValues?: ColumnUniqueValues;
  workbookResources: WorkbookResourceType[];
  workbookColumnMap: WorkbookColumnMap;
  progress: number;
  status?: WorkBookSavingStatus;
  saveProgress: (newValue: number) => void;
  apiBaseUrl?: string;
  group?: string;
  type?: string;
  error?: Error;

  uploadWorkbook: (newSpreadsheetData: WorkbookJSON) => Promise<void>;
  setColumnMap: (newColumnMap : WorkbookColumnMap) => void;
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
  failSavingWorkbook: (error: Error) => Promise<void>;
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
  const initState: State = {
    workbookColumnMap: {},
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

  const cancelSavingWorkbook = async () => {
    await clearWorkbookResources();
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
    await clearWorkbookResources();
    dispatch({
      type: "FINISH_SAVING"
    });
  };

  const failSavingWorkbook = async (error: Error) => {
    writeStorage<WorkbookMetaData>("workbookResourceMetaData", {
      status: "FAILED",
      group: state.group,
      type: state.type,
      apiBaseUrl: state.apiBaseUrl,
      progress: state.progress,
      error
    });
    await clearWorkbookResources();
    dispatch({
      type: "FAIL_SAVING",
      payload: error
    });
  };

  const reset = async () => {
    await clearWorkbookResources();
    deleteFromStorage("workbookResourceMetaData");
    dispatch({
      type: "RESET"
    });
  };

  const uploadWorkbook = async (newSpreadsheetData: WorkbookJSON) => {
    await clearWorkbookResources();
    deleteFromStorage("workbookResourceMetaData");
    dispatch({
      type: "UPLOAD_SPREADSHEET_DATA",
      payload: newSpreadsheetData
    });
  };

  const setColumnMap = (newColumnMap : WorkbookColumnMap) => {
    dispatch({
      type: 'SET_COLUMN_MAP',
      payload: newColumnMap
    })
  }

  return (
    <WorkbookUploadProvider
      value={{
        spreadsheetData: state.spreadsheetData,
        columnUniqueValues: state.columnUniqueValues,
        workbookResources: state.workbookResources,
        workbookColumnMap: state.workbookColumnMap,
        progress: state.progress,
        type: state.type,
        group: state.group,
        apiBaseUrl: state.apiBaseUrl,
        status: state.status,
        error: state.error,

        uploadWorkbook,
        setColumnMap,
        saveProgress,
        startSavingWorkbook,
        pauseSavingWorkbook,
        resumeSavingWorkbook,
        finishSavingWorkbook,
        cancelSavingWorkbook,
        failSavingWorkbook,
        reset
      }}
    >
      {children}
    </WorkbookUploadProvider>
  );
}
