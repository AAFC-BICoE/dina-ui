import { KitsuResource, PersistedResource } from "kitsu";

export interface EncodeResourceCellParams {
  label?: string;
  type?: string;
}

/**
 * Encode a resource as a string identifier to be put into a cell.
 */
export function encodeResourceCell<T extends KitsuResource>(
  resource: T | null | undefined,
  { label = "", type }: EncodeResourceCellParams
): string {
  if (!resource) {
    return "";
  }
  return `${label} (${type || resource.type}/${resource.id})`;
}

/**
 * Decode the resource reference from a cell value.
 *
 * Example input: Mat (agent/f5f77025-592a-4c43-a4a7-863978bf203a)
 * Example input: Mat (agent/1234)
 */
export function decodeResourceCell(
  cellValue: string
): Required<KitsuResource> | null {
  // Get the {type}/{id} identifier from the end of the string if it exists.
  const identifier = /(?<=\()[^()]*(?=\)$)/.exec(cellValue)?.[0];

  if (identifier) {
    const [type, id] = identifier.split("/");
    return { id, type };
  }

  return null;
}
