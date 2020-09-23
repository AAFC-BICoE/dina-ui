import { useQuery, withResponse } from "common-ui";
import { KitsuResource } from "kitsu";
import { AuditToEntityReference } from "../../types/objectstore-api";

export interface ReferenceLinkProps<TResource extends KitsuResource> {
  /** Base API path of the linked resource. */
  baseApiPath: string;

  /** JaVers instanceId e.g. metadata/7c4a69aa-80ac-45e9-b5c8-a16e27c99ffe */
  instanceId: AuditToEntityReference;

  /** JSX Element showing the name and linking to the resource's details page. */
  link: (dto: TResource) => JSX.Element;
}

/**
 * A link from a revision to a referenced resource.
 * Useful for showing the name of a shallow-referenced entity.
 */
export function ReferenceLink<TResource extends KitsuResource>({
  baseApiPath,
  link,
  instanceId: { cdoId, typeName }
}: ReferenceLinkProps<TResource>) {
  const q = useQuery<TResource>({
    path: `${baseApiPath}/${typeName}/${cdoId}`
  });

  return withResponse(q, res => link(res.data as TResource));
}
