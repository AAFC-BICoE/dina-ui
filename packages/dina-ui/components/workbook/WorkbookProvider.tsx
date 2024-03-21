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

import { PersistedResource } from "kitsu";
import { filterBy, useQuery } from "../../../common-ui/lib";
import { ManagedAttribute } from "../../types/collection-api";
import db from "./WorkbookDB";
import { calculateColumnUniqueValuesFromSpreadsheetData } from "./utils/workbookMappingUtils";

async function saveWorkbookResourcesInIndexDB(
  type: string,
  workbookResources: WorkbookResourceType[],
  workbookColumnMap: WorkbookColumnMap
) {
  const workbook = await db.workbooks.get(type);
  if (workbook) {
    await db.workbooks.put({
      name: type,
      workbook: workbookResources,
      relationshipMapping: workbookColumnMap
    });
  } else {
    await db.workbooks.add({
      name: type,
      workbook: workbookResources,
      relationshipMapping: workbookColumnMap
    });
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
  | "SET_COLUMN_MAP"
  | "SET_COLUMN_MAP_VALUE";

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
      return {
        ...state,
        workbookColumnMap: { ...state.workbookColumnMap, ...action.payload }
      };
    case "SET_COLUMN_MAP_VALUE":
      return {
        ...state,
        workbookColumnMap: { ...state.workbookColumnMap, ...action.payload }
      };
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
  managedAttributes: PersistedResource<ManagedAttribute>[];

  uploadWorkbook: (newSpreadsheetData: WorkbookJSON) => Promise<void>;
  setColumnMap: (newColumnMap: WorkbookColumnMap) => void;
  setColumnMapValue: (newColumnMap: WorkbookColumnMap) => void;
  startSavingWorkbook: (
    newWorkbookResources: WorkbookResourceType[],
    newWorkbookColumnMap: WorkbookColumnMap,
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
  const { response: attrResponse } = useQuery<ManagedAttribute[]>({
    path: "collection-api/managed-attribute",
    filter: filterBy([], {
      extraFilters: [
        {
          selector: "managedAttributeComponent",
          comparison: "==",
          arguments: "MATERIAL_SAMPLE"
        }
      ]
    })("")
  });
  useEffect(() => {
    const strMetaData = localStorage.getItem("workbookResourceMetaData");
    const workbookMetaDataInLocalStorage: WorkbookMetaData = strMetaData
      ? JSON.parse(strMetaData)
      : ({} as any);

    const type = state.type ?? workbookMetaDataInLocalStorage?.type;

    async function queryWorkbookResources(typeParam: string) {
      const found = await db.workbooks.get(typeParam);
      const workbookResourcesFromIndexDB = found?.workbook ?? [];
      const workbookColumnMapFromIndexDB = found?.relationshipMapping;
      dispatch({
        type: "RETRIEVE_WORKBOOK_FROM_STORAGE",
        payload: {
          workbookResources: workbookResourcesFromIndexDB,
          workbookColumnMap: workbookColumnMapFromIndexDB,
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
    newWorkbookColumnMap: WorkbookColumnMap,
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
    await saveWorkbookResourcesInIndexDB(
      newType,
      newWorkbookResources,
      newWorkbookColumnMap
    );
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

  const setColumnMap = (newColumnMap: WorkbookColumnMap) => {
    dispatch({
      type: "SET_COLUMN_MAP",
      payload: newColumnMap
    });
  };

  const setColumnMapValue = (newColumnMap: WorkbookColumnMap) => {
    dispatch({
      type: "SET_COLUMN_MAP_VALUE",
      payload: newColumnMap
    });
  };

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
        managedAttributes: attrResponse?.data ?? [],

        uploadWorkbook,
        setColumnMap,
        setColumnMapValue,
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
