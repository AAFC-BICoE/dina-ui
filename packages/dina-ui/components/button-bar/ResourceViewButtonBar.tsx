import { BackButton, ButtonBar, DeleteButton, EditButton } from "common-ui";
import { KitsuResource, PersistedResource } from "kitsu";
import { HasDinaMetaInfo } from "../../types/DinaJsonMetaInfo";

export interface ResourceViewButtonBarProps<
  TResource extends PersistedResource<KitsuResource> & HasDinaMetaInfo
> {
  resource: TResource;
  resourceBaseUrl: string;
  apiBaseUrl: string;
}

/** Button bar for a resource's View page. */
export function ResourceViewButtonBar<
  TResource extends PersistedResource<KitsuResource> & HasDinaMetaInfo
>({
  resource,
  resourceBaseUrl,
  apiBaseUrl
}: ResourceViewButtonBarProps<TResource>) {
  const canEdit = resource.meta?.permissions?.includes("update");
  const canDelete = resource.meta?.permissions?.includes("delete");

  return (
    <ButtonBar>
      <BackButton
        entityId={resource.id}
        entityLink={`/${resourceBaseUrl}`}
        byPassView={true}
      />
      {canEdit && (
        <EditButton
          className="ms-auto"
          entityId={resource.id}
          entityLink={`${resourceBaseUrl}`}
        />
      )}
      {canDelete && (
        <DeleteButton
          className="ms-5"
          id={resource.id}
          options={{ apiBaseUrl }}
          postDeleteRedirect={`${resourceBaseUrl}/list`}
          type={resource.type}
        />
      )}
    </ButtonBar>
  );
}
