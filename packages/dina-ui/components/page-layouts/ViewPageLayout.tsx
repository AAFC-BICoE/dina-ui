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
import { castArray, get, upperCase } from "lodash";
import { useRouter } from "next/router";
import { ReactNode } from "react";
import { Footer, GroupLabel, Head, Nav } from "..";
import { HasDinaMetaInfo } from "../../types/DinaJsonMetaInfo";
import Link from "next/link";
import { DinaMessage } from "../../intl/dina-ui-intl";
import { GenerateLabelDropdownButton } from "../collection/material-sample/GenerateLabelDropdownButton";

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
    specialListUrl?: string;
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
    showEditButton?: boolean;
    showDeleteButton?: boolean;
    showGroup?: boolean;
    showBackButton?: boolean;
    /** Show the link to the "revisions" page if there is one. */
    showRevisionsLink?: boolean;
    showGenerateLabelButton?: boolean;

    /** Show the link to the "revisions" page at page bottom as link. */
    showRevisionsLinkAtBottom?: boolean;

    /** Pass a react node of a tooltip, recommend setting the placement to the right. */
    tooltipNode?: ReactNode;

    alterInitialValues?: (resource: PersistedResource<T>) => any;
    backButton?: JSX.Element;
    forceTitleUppercase?: boolean;
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
  specialListUrl,
  type,
  apiBaseUrl,
  nameField = "name",
  editButton,
  deleteButton,
  showDeleteButton = true,
  showEditButton = true,
  showGroup = true,
  showBackButton = true,
  mainClass = "container-fluid",
  showRevisionsLink,
  showRevisionsLinkAtBottom,
  tooltipNode,
  alterInitialValues,
  showGenerateLabelButton,
  backButton,
  forceTitleUppercase
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
      <Nav marginBottom={false} />
      {withResponse(resourceQuery, ({ data }) => {
        const resource = data as PersistedResource<T>;

        const formProps = {
          initialValues: alterInitialValues?.(resource) ?? resource,
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
        const group = upperCase(get(data, "group") as string);

        // if title is array, only take first element
        if (Array.isArray(title)) {
          title = title[0];
        }
        if (forceTitleUppercase) {
          title = title.toUpperCase();
        }

        return (
          <>
            <Head title={title} />
            <ButtonBar>
              <div className="col-md-2 mt-2">
                {showBackButton &&
                  (backButton ? (
                    backButton
                  ) : specialListUrl ? (
                    <Link
                      href={specialListUrl}
                      className="back-button my-auto me-auto"
                    >
                      <DinaMessage id="backToList" />
                    </Link>
                  ) : (
                    <BackButton
                      entityId={id}
                      className="me-auto"
                      entityLink={entityLink}
                      byPassView={true}
                    />
                  ))}
              </div>
              <div className="col-md-10 flex d-flex col-sm-12 gap-1">
                <span className="ms-auto" />
                {showGenerateLabelButton && (
                  <GenerateLabelDropdownButton resource={resource} />
                )}
                {showEditButton &&
                  canEdit &&
                  (editButton?.(formProps) ?? (
                    <EditButton entityId={id} entityLink={entityLink} />
                  ))}
                {showRevisionsLink && (
                  <Link
                    href={`${entityLink}/revisions?id=${id}`}
                    className="btn btn-info"
                  >
                    <DinaMessage id="revisionsButtonText" />
                  </Link>
                )}
                {showDeleteButton &&
                  canDelete &&
                  (deleteButton ? (
                    deleteButton(formProps)
                  ) : (
                    <DeleteButton
                      id={id}
                      options={{ apiBaseUrl }}
                      postDeleteRedirect={
                        specialListUrl ? specialListUrl : `${entityLink}/list`
                      }
                      type={type}
                    />
                  ))}
              </div>
            </ButtonBar>
            <main className={mainClass}>
              <h1 id="wb-cont" className="d-flex justify-content-between">
                <span>
                  {title}
                  {tooltipNode}
                </span>
                {showGroup && (
                  <span className="header-group-text">
                    {<GroupLabel groupName={group} />}
                  </span>
                )}
              </h1>

              {form(formProps)}
              {showRevisionsLinkAtBottom && (
                <Link href={`${entityLink}/revisions?id=${id}`}>
                  <DinaMessage id="revisionsButtonText" />
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
