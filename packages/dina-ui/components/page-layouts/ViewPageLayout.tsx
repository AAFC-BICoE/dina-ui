import {
  BackButton,
  ButtonBar,
  DeleteButton,
  EditButton,
  JsonApiQuerySpec,
  QueryOptions,
  QueryState,
  useQuery,
  CustomQueryHook,
  withResponse
} from "common-ui";
import { KitsuResource, PersistedResource } from "kitsu";
import _ from "lodash";
import { useRouter } from "next/router";
import { ReactNode } from "react";
import { Footer, GroupLabel, Head, Nav } from "..";
import { HasDinaMetaInfo } from "../../types/DinaJsonMetaInfo";
import Link from "next/link";
import { DinaMessage } from "../../intl/dina-ui-intl";
import { GenerateLabelDropdownButton } from "../collection/material-sample/GenerateLabelDropdownButton";
import { FaRegClock } from "react-icons/fa";

type ViewPageLayoutPropsBase<T extends KitsuResource> = {
  form: (formProps: ResourceFormProps<T>) => ReactNode;
  entityLink: string;
  specialListUrl?: string;
  type: string;
  apiBaseUrl: string;

  /** The field on the resource to use as the page title. */
  nameField?: string | string[] | ((resource: PersistedResource<T>) => string);

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

/** Props for the ViewPageLayoutWithCustomHook component. */
export type ViewPageLayoutWithCustomHookProps<T extends KitsuResource> =
  ViewPageLayoutPropsBase<T> & {
    /** Custom query hook which may have more complicated logic than the usual useQuery hook. */
    customQueryHook: CustomQueryHook<T>;

    /** Optional arguments to pass to the custom query hook. */
    customQueryHookOptions?: any;
  };

export type ViewPageLayoutProps<T extends KitsuResource> =
  ViewPageLayoutPropsBase<T> & {
    /** Optional arguments to pass to the useQuery hook. */
    queryOptions?: QueryOptions<T, unknown>;
    /** A function that returns the JsonApiQuerySpec to fetch the resource being viewed. */
    query: (id: string) => JsonApiQuerySpec;
  };

type ViewPageLayoutInnerProps<T extends KitsuResource> =
  ViewPageLayoutPropsBase<T> & {
    /** The query state for the resource being viewed, including the data and any loading or error state. */
    resourceQuery: QueryState<T & HasDinaMetaInfo, unknown>;
  };

export interface ResourceFormProps<T extends KitsuResource> {
  initialValues: PersistedResource<T>;
  readOnly: boolean;
}

/**
 * Generic page layout for viewing one record.
 *
 * It will add the "include-dina-permission" header automatically.
 *
 * If a permissionProvider is returned with the data then the buttons will disappear automatically
 * if the user does not have the correct permissions.
 */
export function ViewPageLayout<T extends KitsuResource>(
  props: ViewPageLayoutProps<T>
) {
  const router = useRouter();
  const id = String(router.query.id);
  const { query, queryOptions } = props;
  const resourceQuery = useQuery(
    { ...query(id), header: { "include-dina-permission": "true" } },
    { disabled: !id, ...queryOptions }
  ) as QueryState<T & HasDinaMetaInfo, unknown>;

  const viewPageLayoutInnerProps: ViewPageLayoutInnerProps<T> = {
    ..._.omit(props, "query", "queryOptions"),
    resourceQuery
  };

  return <ViewPageLayoutInner {...viewPageLayoutInnerProps} />;
}

/**
 * Generic page layout for viewing one record, with a custom query hook that can have more complicated logic than the usual useQuery hook.
 *
 * Unlike the normal ViewPageLayout, this component does not automatically add the "include-dina-permission" header.
 * If you need that header, you must add it manually in your custom query hook.
 *
 * If a permissionProvider is returned with the data then the buttons will disappear automatically
 * if the user does not have the correct permissions.
 */
export function ViewPageLayoutWithCustomHook<T extends KitsuResource>(
  props: ViewPageLayoutWithCustomHookProps<T>
) {
  const router = useRouter();
  const id = String(router.query.id);
  const { customQueryHook, customQueryHookOptions } = props;
  const resourceQuery = customQueryHook(id, customQueryHookOptions);

  const viewPageLayoutInnerProps: ViewPageLayoutInnerProps<T> = {
    ..._.omit(props, "customQueryHook", "customQueryHookOptions"),
    resourceQuery
  };

  return <ViewPageLayoutInner {...viewPageLayoutInnerProps} />;
}

/** The inner component that actually renders the page, used by both ViewPageLayout and ViewPageLayoutWithCustomHook. */
function ViewPageLayoutInner<T extends KitsuResource>({
  form,
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
  forceTitleUppercase,
  resourceQuery
}: ViewPageLayoutInnerProps<T>) {
  return (
    <div>
      <Nav marginBottom={false} />
      {withResponse(resourceQuery, ({ data }) => {
        const resource = data as PersistedResource<T>;
        const id = data.id;
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

        const nameFields = _.castArray(nameField);
        let title = [...nameFields, "id"].reduce(
          (lastValue, currentField) =>
            lastValue ||
            (typeof currentField === "function"
              ? currentField(resource)
              : _.get(data, currentField)),
          ""
        );
        const group = _.upperCase(_.get(data, "group") as string);

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
                    <FaRegClock className="me-2" />
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
