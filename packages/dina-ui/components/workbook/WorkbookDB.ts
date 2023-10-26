import Dexie, { Table } from "dexie";
import { WorkbookResourceType } from "./types/Workbook";

export interface Workbook {
  name: string;
  workbook: WorkbookResourceType[];
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
