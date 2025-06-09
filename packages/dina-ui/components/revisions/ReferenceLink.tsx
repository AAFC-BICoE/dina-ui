import { useQuery, withResponse } from "common-ui";
import { KitsuResource, PersistedResource } from "kitsu";
import Link from "next/link";
import { AuditToEntityReference } from "../../types/objectstore-api";

export interface ReferenceLinkProps<TResource extends KitsuResource> {
  /** Base API path of the linked resource. */
  baseApiPath: string;
  type: string;

  /** JaVers instanceId e.g. metadata/7c4a69aa-80ac-45e9-b5c8-a16e27c99ffe */
  reference: AuditToEntityReference;

  /** Function returning the name of the resource. */
  name: (dto: PersistedResource<TResource>) => string | JSX.Element | undefined;

  /** Link to the resource details page. */
  href?: string;
}

/**
 * A link from a revision to a referenced resource.
 * Useful for showing the name of a shallow-referenced entity.
 */
export function ReferenceLink<TResource extends KitsuResource>({
  baseApiPath,
  name,
  href,
  reference,
  type
}: ReferenceLinkProps<TResource>) {
  const id = reference.id || reference.cdoId;

  const q = useQuery<TResource>(
    { path: `${baseApiPath}/${type}/${id}` },
    { disabled: !id || !type }
  );

  return withResponse(q, (res) => {
    const content =
      name(res.data as PersistedResource<TResource>) || res.data.id;

    return href ? (
      <Link href={`${href}${res.data.id}`}>{content}</Link>
    ) : (
      <>{content}</>
    );
  });
}
