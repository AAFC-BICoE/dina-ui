import Kitsu from "kitsu";
import { RelationshipMapping } from "../types/Workbook";

export interface DuplicatePrimaryId {
  materialSampleName: string;
  collectionName?: string;
  collectionUuid?: string;
  rowNumbers: number[];
  localDuplicate: boolean;
  serverDuplicate: boolean;
}

/** Relationship mapping keys are stored with dots replaced. */
export function getRelationshipMappingKey(value: string): string {
  return value.replaceAll(".", "_");
}

/**
 * Groups the workbook rows by primary id (and collection if the collection column is mapped),
 * flagging the entries that appear more than once on the spreadsheet.
 */
export function getPrimaryIdEntries(
  workbookData: { [field: string]: any }[],
  collectionColumnHeader: string | undefined,
  relationshipMapping: RelationshipMapping | undefined
): DuplicatePrimaryId[] {
  const entries = new Map<string, DuplicatePrimaryId>();

  for (const row of workbookData) {
    const materialSampleName = String(row.materialSampleName ?? "").trim();
    if (!materialSampleName) {
      continue;
    }

    const collectionName: string | undefined = collectionColumnHeader
      ? row["collection.name"]
      : undefined;
    const key = JSON.stringify([materialSampleName, collectionName ?? null]);

    const existing = entries.get(key);
    if (existing) {
      existing.localDuplicate = true;
      existing.rowNumbers.push(row.rowNumber);
      continue;
    }

    const mappedCollection =
      collectionColumnHeader && collectionName
        ? relationshipMapping?.[
            getRelationshipMappingKey(collectionColumnHeader)
          ]?.[getRelationshipMappingKey(String(collectionName))]
        : undefined;
    const collectionUuid = Array.isArray(mappedCollection)
      ? undefined
      : mappedCollection?.id;

    entries.set(key, {
      materialSampleName,
      collectionName,
      collectionUuid,
      rowNumbers: [row.rowNumber],
      localDuplicate: false,
      serverDuplicate: false
    });
  }

  return Array.from(entries.values());
}

/**
 * Best effort check for material samples that already exist with the same primary id in the
 * same collection. Entries without a resolved collection cannot be checked.
 */
export async function checkServerDuplicatePrimaryIds(
  apiClient: Kitsu,
  entries: DuplicatePrimaryId[]
): Promise<DuplicatePrimaryId[]> {
  return Promise.all(
    entries.map(async (entry) => {
      if (!entry.collectionUuid) {
        return entry;
      }

      const path = `collection-api/material-sample?filter[materialSampleName][EQ]=${encodeURIComponent(
        entry.materialSampleName
      )}&filter[collection.id][EQ]=${encodeURIComponent(entry.collectionUuid)}`;

      try {
        const response = await apiClient.get<unknown[]>(path, {
          page: { limit: 1 }
        });
        return { ...entry, serverDuplicate: response.data.length > 0 };
      } catch (error) {
        console.error(
          `Error checking server duplicate for ${entry.materialSampleName}/${entry.collectionName}:`,
          error
        );
        return entry;
      }
    })
  );
}

export function getDuplicateRowNumbers(
  entries: DuplicatePrimaryId[]
): number[] {
  return entries
    .filter((entry) => entry.localDuplicate || entry.serverDuplicate)
    .flatMap((entry) => entry.rowNumbers);
}
