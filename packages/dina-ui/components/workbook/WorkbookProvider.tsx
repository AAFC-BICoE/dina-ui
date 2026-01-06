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
  RelationshipMapping,
  WorkbookColumnMap,
  WorkbookJSON,
  WorkbookResourceType
} from "./types/Workbook";

import { useAccount } from "../../../common-ui/lib";
import db from "./WorkbookDB";
import {
  calculateColumnUniqueValuesFromSpreadsheetData,
  detectEntityType,
  removeEmptyColumns
} from "./utils/workbookMappingUtils";

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
  | "SET_RELATIONSHIP_MAPPING"
  | "SET_COLUMN_MAP_VALUE"
  | "SET_SHEET"
  | "SET_GROUP"
  | "SET_TYPE";

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
  relationshipMapping: RelationshipMapping;
  progress: number;
  status?: WorkBookSavingStatus;
  type: string;
  sheet: number;
  group?: string;
  apiBaseUrl?: string;
  error?: Error;
  sourceSet?: string;
  appendData?: boolean;
  resourcesUpdatedCount?: number;
};

interface WorkbookMetaData {
  progress: number;
  status?: WorkBookSavingStatus;
  type?: string;
  group?: string;
  apiBaseUrl?: string;
  error?: Error;
  appendData?: boolean;
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
        ...state,
        workbookColumnMap: {},
        relationshipMapping: {},
        workbookResources: [],
        columnUniqueValues: undefined,
        spreadsheetData: undefined,
        progress: 0,
        sheet: 0,
        type: "material-sample",
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
        apiBaseUrl: action.payload.apiBaseUrl,
        appendData: action.payload.appendData
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
        sourceSet: action.payload.sourceSet,
        resourcesUpdatedCount: action.payload.resourcesUpdatedCount
      };
    case "RESET":
      return {
        ...state,
        sheet: 0,
        type: "material-sample",
        workbookColumnMap: {},
        relationshipMapping: {},
        workbookResources: [],
        columnUniqueValues: undefined,
        spreadsheetData: undefined,
        progress: 0
      };
    case "UPLOAD_SPREADSHEET_DATA":
      const spreadsheetData: WorkbookJSON = removeEmptyColumns(action.payload);
      const columnUniqueValues: ColumnUniqueValues =
        calculateColumnUniqueValuesFromSpreadsheetData(spreadsheetData);

      // Auto-detect entity type based on column headers
      const detectedType = detectEntityType(spreadsheetData, 0);

      return {
        ...state,
        sheet: 0,
        type: detectedType,
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
    case "SET_RELATIONSHIP_MAPPING":
      return {
        ...state,
        relationshipMapping: { ...state.relationshipMapping, ...action.payload }
      };
    case "SET_COLUMN_MAP_VALUE":
      return {
        ...state,
        workbookColumnMap: { ...state.workbookColumnMap, ...action.payload }
      };
    case "SET_GROUP":
      return {
        ...state,
        group: action.payload
      };
    case "SET_SHEET":
      return {
        ...state,
        sheet: action.payload
      };
    case "SET_TYPE":
      return {
        ...state,
        type: action.payload
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
  relationshipMapping: RelationshipMapping;
  progress: number;
  status?: WorkBookSavingStatus;
  saveProgress: (newValue: number) => void;
  apiBaseUrl?: string;
  group?: string;
  type: string;
  sheet: number;
  error?: Error;
  sourceSet?: string;
  appendData?: boolean;
  resourcesUpdatedCount?: number;

  uploadWorkbook: (newSpreadsheetData: WorkbookJSON) => Promise<void>;
  setColumnMap: (newColumnMap: WorkbookColumnMap) => void;
  setRelationshipMapping: (
    newRelationshipMapping?: RelationshipMapping
  ) => void;
  setColumnMapValue: (newColumnMap: WorkbookColumnMap) => void;
  startSavingWorkbook: (
    newWorkbookResources: WorkbookResourceType[],
    newWorkbookColumnMap: WorkbookColumnMap,
    relationshipMapping: RelationshipMapping,
    group: string,
    type: string,
    apiBaseUrl: string,
    appendData: boolean
  ) => Promise<void>;
  pauseSavingWorkbook: () => void;
  resumeSavingWorkbook: () => void;
  finishSavingWorkbook: (
    sourceSet: string,
    resourcesUpdatedCount: number
  ) => Promise<void>;
  cancelSavingWorkbook: (type?: string) => Promise<void>;
  failSavingWorkbook: (error: Error) => Promise<void>;
  setGroup: (group: string) => void;
  setType: (type: string) => void;
  setSheet: (sheet: number) => void;
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
  const { groupNames } = useAccount();
  const initState: State = {
    workbookColumnMap: {},
    relationshipMapping: {},
    workbookResources: [],
    progress: 0,
    sheet: 0,
    type: "material-sample",
    group: groupNames?.[0],
    appendData: false
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
    relationshipMapping: RelationshipMapping,
    newGroup: string,
    newType: string,
    newApiBaseUrl: string,
    appendData: boolean
  ) => {
    for (const columnHeader of Object.keys(relationshipMapping)) {
      const relationshipColumn = relationshipMapping[columnHeader];
      if (
        relationshipColumn !== undefined &&
        newWorkbookColumnMap[columnHeader]?.mapRelationship
      ) {
        newWorkbookColumnMap[columnHeader].valueMapping =
          relationshipColumn as any;
      }
    }
    writeStorage<WorkbookMetaData>("workbookResourceMetaData", {
      status: "SAVING",
      group: newGroup,
      type: newType,
      apiBaseUrl: newApiBaseUrl,
      progress: 0,
      appendData
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
        apiBaseUrl: newApiBaseUrl,
        appendData
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

  const finishSavingWorkbook = async (
    sourceSet: string,
    resourcesUpdatedCount: number
  ) => {
    writeStorage<WorkbookMetaData>("workbookResourceMetaData", {
      status: "FINISHED",
      group: state.group,
      type: state.type,
      apiBaseUrl: state.apiBaseUrl,
      progress: state.progress
    });
    await clearWorkbookResources();
    dispatch({
      type: "FINISH_SAVING",
      payload: {
        sourceSet,
        resourcesUpdatedCount
      }
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

  const setRelationshipMapping = (
    newRelationshipMapping?: RelationshipMapping
  ) => {
    dispatch({
      type: "SET_RELATIONSHIP_MAPPING",
      payload: newRelationshipMapping
    });
  };

  const setColumnMapValue = (newColumnMap: WorkbookColumnMap) => {
    dispatch({
      type: "SET_COLUMN_MAP_VALUE",
      payload: newColumnMap
    });
  };

  const setGroup = (group: string) => {
    dispatch({
      type: "SET_GROUP",
      payload: group
    });
  };
  const setType = (type: string) => {
    dispatch({
      type: "SET_TYPE",
      payload: type
    });
  };
  const setSheet = (sheet: number) => {
    dispatch({
      type: "SET_SHEET",
      payload: sheet
    });
  };

  return (
    <WorkbookUploadProvider
      value={{
        spreadsheetData: state.spreadsheetData,
        columnUniqueValues: state.columnUniqueValues,
        workbookResources: state.workbookResources,
        workbookColumnMap: state.workbookColumnMap,
        relationshipMapping: state.relationshipMapping,
        progress: state.progress,
        type: state.type,
        group: state.group,
        sheet: state.sheet,
        apiBaseUrl: state.apiBaseUrl,
        status: state.status,
        error: state.error,
        sourceSet: state.sourceSet,
        appendData: state.appendData,
        resourcesUpdatedCount: state.resourcesUpdatedCount,

        uploadWorkbook,
        setColumnMap,
        setRelationshipMapping,
        setColumnMapValue,
        saveProgress,
        startSavingWorkbook,
        pauseSavingWorkbook,
        resumeSavingWorkbook,
        finishSavingWorkbook,
        cancelSavingWorkbook,
        failSavingWorkbook,
        setGroup,
        setSheet,
        setType,
        reset
      }}
    >
      {children}
    </WorkbookUploadProvider>
  );
}
