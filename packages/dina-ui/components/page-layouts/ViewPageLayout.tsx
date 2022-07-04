import {
  BackButton,
  ButtonBar,
  ButtonBarRight,
  DeleteButton,
  EditButton,
  JsonApiQuerySpec,
  QueryOptions,
  QueryState,
  useQuery,
  withResponse
} from "common-ui";
import { KitsuResource, PersistedResource } from "kitsu";
import { castArray, get } from "lodash";
import { useRouter } from "next/router";
import { ReactNode } from "react";
import { Footer, Head, Nav } from "..";
import { HasDinaMetaInfo } from "../../types/DinaJsonMetaInfo";
import Link from "next/link";
import { DinaMessage } from "../../intl/dina-ui-intl";

/** This Component requires either the "query" or "customQueryHook" prop. */
type ViewPageLayoutPropsBase<T extends KitsuResource> =
  | {
      /** The JSONAPI query. */
      query: (id: string) => JsonApiQuerySpec;
      customQueryHook?: never;
    }
  | {
      query?: never;
      /** Custom query hook which may have more complicated logic than the usual useQuery hook. */
      customQueryHook: (id: string) => QueryState<T, unknown>;
    };

export type ViewPageLayoutProps<T extends KitsuResource> =
  ViewPageLayoutPropsBase<T> & {
    queryOptions?: QueryOptions<T, unknown>;
    form: (formProps: ResourceFormProps<T>) => ReactNode;
    entityLink: string;
    type: string;
    apiBaseUrl: string;

    /** The field on the resource to use as the page title. */
    nameField?:
      | string
      | string[]
      | ((resource: PersistedResource<T>) => string);

    /** main tag class, defaults to "container" */
    mainClass?: string;

    // Override page elements:
    editButton?: (formProps: ResourceFormProps<T>) => ReactNode;
    deleteButton?: (formProps: ResourceFormProps<T>) => ReactNode;
    /** Show the link to the "revisions" page if there is one. */
    showRevisionsLink?: boolean;

    /** Show the link to the "revisions" page at page bottom as link. */
    showRevisionsLinkAtBottom?: boolean;
  };

export interface ResourceFormProps<T extends KitsuResource> {
  initialValues: PersistedResource<T>;
  readOnly: boolean;
}

/**
 * Generic page layout for viewing one record.
 *
 * This component supports the use of queries or custom query hooks.
 *
 * For normal queries, it will add the "include-dina-permission" header automatically. For
 * custom hooks you will need to apply that logic if needed.
 *
 * If a permissionProvider is returned with the data then the buttons will disappear automatically
 * if the user does not have the correct permissions.
 */
export function ViewPageLayout<T extends KitsuResource>({
  form,
  query,
  customQueryHook,
  queryOptions,
  entityLink,
  type,
  apiBaseUrl,
  nameField = "name",
  editButton,
  deleteButton,
  mainClass,
  showRevisionsLink,
  showRevisionsLinkAtBottom
}: ViewPageLayoutProps<T>) {
  const router = useRouter();
  const id = String(router.query.id);

  const resourceQuery = (customQueryHook?.(id) ??
    (query &&
      useQuery(
        { ...query(id), header: { "include-dina-permission": "true" } },
        { disabled: !id, ...queryOptions }
      ))) as QueryState<T & HasDinaMetaInfo, unknown>;

  return (
    <div>
      <Nav />
      {withResponse(resourceQuery, ({ data }) => {
        const resource = data as PersistedResource<T>;

        const formProps = {
          initialValues: resource,
          readOnly: true
        };

        // Check the request to see if a permission provider is present.
        const permissionsProvided = data.meta?.permissionsProvider;

        const canEdit = permissionsProvided
          ? data.meta?.permissions?.includes("update") ?? false
          : true;
        const canDelete = permissionsProvided
          ? data.meta?.permissions?.includes("delete") ?? false
          : true;

        const nameFields = castArray(nameField);
        let title = [...nameFields, "id"].reduce(
          (lastValue, currentField) =>
            lastValue ||
            (typeof currentField === "function"
              ? currentField(resource)
              : get(data, currentField)),
          ""
        );
        // if title is array, only take first element
        if (Array.isArray(title)) {
          title = title[0];
        }

        return (
          <>
            <Head title={title} />
            <ButtonBar className="gap-2">
              <BackButton
                entityId={id}
                className="me-auto"
                entityLink={entityLink}
                byPassView={true}
              />
              <ButtonBarRight>
                {canEdit &&
                  (editButton?.(formProps) ?? (
                    <EditButton entityId={id} entityLink={entityLink} />
                  ))}
                {showRevisionsLink && (
                  <Link href={`${entityLink}/revisions?id=${id}`}>
                    <a className="btn btn-info">
                      <DinaMessage id="revisionsButtonText" />
                    </a>
                  </Link>
                )}
                {canDelete &&
                  (deleteButton ? (
                    deleteButton(formProps)
                  ) : (
                    <DeleteButton
                      id={id}
                      options={{ apiBaseUrl }}
                      postDeleteRedirect={`${entityLink}/list`}
                      type={type}
                    />
                  ))}
              </ButtonBarRight>
            </ButtonBar>
            <main className={mainClass + " px-5 container-fluid"}>
              <h1 id="wb-cont">{title}</h1>
              {form(formProps)}
              {showRevisionsLinkAtBottom && (
                <Link href={`${entityLink}/revisions?id=${id}`}>
                  <a>
                    <DinaMessage id="revisionsButtonText" />
                  </a>
                </Link>
              )}
            </main>
          </>
        );
      })}
      <Footer />
    </div>
  );
}
