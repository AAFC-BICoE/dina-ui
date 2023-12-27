import Dexie, { Table } from "dexie";
import { WorkbookColumnMap, WorkbookResourceType } from "./types/Workbook";

export interface Workbook {
  name: string;
  workbook: WorkbookResourceType[];
  relationshipMapping: WorkbookColumnMap;
}

export class WorkbookDB extends Dexie {
  workbooks!: Table<Workbook>;

  constructor() {
    super("workbookDB");
    this.version(1).stores({
      workbooks: "name, workbook"
    });
  }
}

const db = new WorkbookDB();

export default db;
