import {
  BackButton,
  ButtonBar,
  DeleteButton,
  EditButton,
  JsonApiQuerySpec,
  QueryOptions,
  QueryState,
  useQuery,
  withResponse
} from "common-ui";
import { KitsuResource, PersistedResource } from "kitsu";
import { get } from "lodash";
import { useRouter } from "next/router";
import { ReactNode } from "react";
import { Footer, Head, Nav } from "..";
import { HasDinaMetaInfo } from "../../types/DinaJsonMetaInfo";
import Link from "next/link";
import { DinaMessage } from "../../intl/dina-ui-intl";

export interface ViewPageLayoutProps<T extends KitsuResource> {
  query: (id: string) => JsonApiQuerySpec;
  /** Override useQuery call with a custom hook call. */
  customQueryHook?: (id: string) => QueryState<T, unknown>;
  queryOptions?: QueryOptions<T, unknown>;
  form: (formProps: ResourceFormProps<T>) => ReactNode;
  entityLink: string;
  type: string;
  apiBaseUrl: string;

  /** The field on the resource to use as the page title. */
  nameField?: string;

  /** main tag class, defaults to "container" */
  mainClass?: string;

  isRestricted?: boolean;

  // Override page elements:
  editButton?: (formProps: ResourceFormProps<T>) => ReactNode;
  deleteButton?: (formProps: ResourceFormProps<T>) => ReactNode;
  /** Show the link to the "revisions" page if there is one. */
  showRevisionsLink?: boolean;
}

export interface ResourceFormProps<T extends KitsuResource> {
  initialValues: PersistedResource<T>;
  readOnly: boolean;
}

/** Generic page layout for viewing one record. */
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
  mainClass = "container",
  showRevisionsLink,
  isRestricted
}: ViewPageLayoutProps<T>) {
  const router = useRouter();
  const id = String(router.query.id);

  const resourceQuery: QueryState<T & HasDinaMetaInfo, unknown> =
    customQueryHook?.(id) ??
    useQuery(
      { ...query(id), header: { "include-dina-permission": "true" } },
      { disabled: !id, ...queryOptions }
    );

  return (
    <div>
      <Nav />
      <main className={mainClass}>
        {withResponse(resourceQuery, ({ data }) => {
          const formProps = {
            initialValues: data as PersistedResource<T>,
            readOnly: true
          };

          const canEdit = isRestricted
            ? data.meta?.permissions?.includes("update")
            : true;
          const canDelete = isRestricted
            ? data.meta?.permissions?.includes("delete")
            : true;

          return (
            <>
              <Head title={get(data, nameField)} />
              <ButtonBar>
                <BackButton
                  entityId={id}
                  className="me-auto"
                  entityLink={entityLink}
                  byPassView={true}
                />
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
                  (deleteButton?.(formProps) ?? (
                    <DeleteButton
                      className="ms-5"
                      id={id}
                      options={{ apiBaseUrl }}
                      postDeleteRedirect={`${entityLink}/list`}
                      type={type}
                    />
                  ))}
              </ButtonBar>
              {form(formProps)}
              <Footer />
            </>
          );
        })}
      </main>
    </div>
  );
}
