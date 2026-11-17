import Kitsu from "kitsu";
import _ from "lodash";
import { SimpleSearchFilterBuilder } from "../../../../common-ui/lib";
import { MaterialSample } from "../../../types/collection-api";
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
  // One request per collection and chunk of 100 names instead of one per row.
  // Commas are the IN separator, so names containing one are looked up individually with EQ.
  const existing = new Set<string>();
  const failed = new Set<string>();
  const byCollection = _.groupBy(
    entries.filter((entry) => entry.collectionUuid),
    (entry) => entry.collectionUuid
  );

  await Promise.all(
    Object.entries(byCollection).flatMap(([collectionUuid, group]) => {
      const [commaNames, plainNames] = _.partition(
        _.uniq(group.map((entry) => entry.materialSampleName)),
        (name) => name.includes(",")
      );
      return [
        ..._.chunk(plainNames, 100),
        ...commaNames.map((name) => [name])
      ].map(async (names) => {
        try {
          const response = await apiClient.get<MaterialSample[]>(
            "collection-api/material-sample",
            {
              filter: SimpleSearchFilterBuilder.create<MaterialSample>()
                .where("collection.uuid" as any, "EQ", collectionUuid)
                .where(
                  "materialSampleName",
                  names.length === 1 ? "EQ" : "IN",
                  names.length === 1 ? names[0] : names
                )
                .build(),
              fields: { "material-sample": "materialSampleName" },
              page: { limit: 1000 }
            }
          );
          response.data.forEach((sample) =>
            existing.add(`${collectionUuid}/${sample.materialSampleName}`)
          );
        } catch (error) {
          console.error(
            `Error checking server duplicates for collection ${collectionUuid}:`,
            error
          );
          names.forEach((name) => failed.add(`${collectionUuid}/${name}`));
        }
      });
    })
  );

  return entries.map((entry) => {
    const key = `${entry.collectionUuid}/${entry.materialSampleName}`;
    return !entry.collectionUuid || failed.has(key)
      ? entry
      : { ...entry, serverDuplicate: existing.has(key) };
  });
}

export function getDuplicateRowNumbers(
  entries: DuplicatePrimaryId[]
): number[] {
  return entries
    .filter((entry) => entry.localDuplicate || entry.serverDuplicate)
    .flatMap((entry) => entry.rowNumbers);
}
