import classNames from "classnames";
import {
  FilterGroupModel,
  FormikButton,
  LoadingSpinner,
  MetaWithTotal,
  Operation,
  rsql,
  useApiClient,
  useQuery,
  withResponse,
} from "common-ui";
import { PersistedResource } from "kitsu";
import Link from "next/link";
import Pagination from "rc-pagination";
import { useState, useEffect } from "react";
import { FaMinusSquare, FaPlusSquare } from "react-icons/fa";
import { Promisable } from "type-fest";
import { DinaMessage, useDinaIntl } from "../../intl/dina-ui-intl";
import { StorageUnit } from "../../types/collection-api";
import { StorageFilter } from "./StorageFilter";
import {
  StorageUnitBreadCrumb,
  storageUnitDisplayName,
} from "./StorageUnitBreadCrumb";

export interface BrowseStorageTreeProps {
  onSelect?: (storageUnit: PersistedResource<StorageUnit>) => Promisable<void>;
  readOnly?: boolean;
}

/** Hierarchy of nodes UI to search for and find a Storage Unit. */
export function BrowseStorageTree(props: BrowseStorageTreeProps) {
  const [filter, setFilter] = useState<FilterGroupModel | null>(null);

  const isFiltered = !!filter?.children?.length;

  return (
    <div>
      <StorageFilter onChange={setFilter} />
      <div className={`fw-bold mb-3`}>
        {isFiltered ? (
          <DinaMessage id="showingFilteredStorageUnits" />
        ) : (
          <DinaMessage id="showingTopLevelStorageUnits" />
        )}
        {":"}
      </div>
      <StorageTreeList {...props} filter={filter} showPathInName={isFiltered} />
    </div>
  );
}

export interface StorageTreeListProps {
  storageUnitChildren?: PersistedResource<StorageUnit>[];

  parentId?: string;

  onSelect?: (storageUnit: PersistedResource<StorageUnit>) => Promisable<void>;

  disabled?: boolean;

  filter?: FilterGroupModel | null;

  /** Show the hierarchy path in the name. (Top-level only). */
  showPathInName?: boolean;
}

export function StorageTreeList({
  storageUnitChildren,
  onSelect,
  parentId,
  disabled,
  filter,
  showPathInName,
}: StorageTreeListProps) {
  const limit = 100;
  const [pageNumber, setPageNumber] = useState(1);
  const offset = (pageNumber - 1) * limit;
  const [tempStorageUnitChildren, setTempStorageUnitChildren] = useState<
    StorageUnit[] | undefined
  >(storageUnitChildren ? [] : undefined);
  const { bulkGet } = useApiClient();
  const [loading, setLoading] = useState<boolean>(
    storageUnitChildren ? true : false
  );

  async function fetchStorageUnitChildren() {
    if (storageUnitChildren) {
      await bulkGet<StorageUnit>(
        storageUnitChildren.map(
          (storageUnit) =>
            "/storage-unit/" + storageUnit.id + "?include=storageUnitType"
        ),
        { apiBaseUrl: "/collection-api" }
      ).then((response) => {
        setTempStorageUnitChildren(response);
        setLoading(false);
      });
    }
  }

  const storageUnitsQuery = useQuery<StorageUnit[], MetaWithTotal>(
    {
      path: `collection-api/storage-unit`,
      include: "storageUnitChildren,storageUnitType",
      page: { limit, offset },
      sort: "storageUnitType.name,name",
      filter: {
        rsql: rsql({
          type: "FILTER_GROUP",
          id: -123,
          operator: "AND",
          children: [
            // For inner storage units:
            ...(parentId
              ? [
                  {
                    id: -321,
                    type: "FILTER_ROW" as const,
                    attribute: "parentStorageUnit.uuid",
                    predicate: "IS" as const,
                    searchType: "EXACT_MATCH" as const,
                    value: parentId,
                  },
                ]
              : []),
            ...(filter ? [filter] : []),
          ],
        }),
        // For top-level storage units:
        ...(!filter?.children?.length && !parentId
          ? { parentStorageUnit: null }
          : {}),
      },
    },
    { disabled: storageUnitChildren !== undefined }
  );

  useEffect(() => {
    if (storageUnitChildren) {
      fetchStorageUnitChildren();
    }
  }, [storageUnitChildren]);

  // If the children are provided we can skip the query and just display them.
  if (tempStorageUnitChildren) {
    return loading ? (
      <LoadingSpinner loading={true} />
    ) : (
      <>
        {tempStorageUnitChildren.map((unit, index) => (
          <div
            className={
              index === tempStorageUnitChildren.length - 1 ? "" : "my-2"
            }
            key={unit.id}
          >
            <StorageUnitCollapser
              showPathInName={showPathInName}
              storageUnit={unit as PersistedResource<StorageUnit>}
              onSelect={onSelect}
              disabled={disabled}
              checkForChildren={false}
            />
          </div>
        ))}
      </>
    );
  }

  return withResponse(
    storageUnitsQuery,
    ({ data: units, meta: { totalResourceCount } }) => (
      <div>
        {totalResourceCount === 0 ? (
          <DinaMessage id="noChildren" />
        ) : (
          <>
            {units.map((unit, index) => (
              <div
                className={index === units.length - 1 ? "" : "my-2"}
                key={unit.id}
              >
                <StorageUnitCollapser
                  showPathInName={showPathInName}
                  storageUnit={unit}
                  onSelect={onSelect}
                  disabled={disabled}
                  checkForChildren={true}
                />
              </div>
            ))}
            <Pagination
              total={totalResourceCount}
              locale={{}}
              pageSize={limit}
              current={pageNumber}
              onChange={setPageNumber}
              hideOnSinglePage={true}
            />
          </>
        )}
      </div>
    )
  );
}

interface StorageUnitCollapserProps {
  storageUnit: PersistedResource<StorageUnit>;
  onSelect?: (storageUnit: PersistedResource<StorageUnit>) => void;

  disabled?: boolean;

  /** Show the hierarchy path in the name. (This collapser only). */
  showPathInName?: boolean;

  /** If the storage unit has  */
  checkForChildren?: boolean;
}

function StorageUnitCollapser({
  storageUnit,
  onSelect,
  disabled,
  showPathInName,
  checkForChildren,
}: StorageUnitCollapserProps) {
  const [isOpen, setOpen] = useState(false);
  const { formatMessage } = useDinaIntl();

  function toggle(e) {
    if (
      e.code === "Enter" ||
      e.code === "Space" ||
      e.code === " " ||
      e.type === "click"
    )
      setOpen((current) => !current);
  }

  const CollapserIcon = isOpen ? FaMinusSquare : FaPlusSquare;

  const hasChildren = checkForChildren
    ? !!(storageUnit as any)?.storageUnitChildren?.length
    : true;

  return (
    <div className={`d-flex flex-row gap-2 collapser-for-${storageUnit.id}`}>
      <CollapserIcon
        onKeyPress={toggle}
        onClick={toggle}
        tabIndex={0}
        size="2em"
        className={classNames("storage-collapser-icon aligh-top", {
          // Hide the expander button when there are no children:
          invisible: !hasChildren,
        })}
        style={{ cursor: "pointer" }}
        title={isOpen ? formatMessage("collapse") : formatMessage("expand")}
      />
      <div className="flex-grow-1">
        <div className="d-flex flex-row align-items-center gap-2 mb-3">
          {showPathInName ? (
            <StorageUnitBreadCrumb storageUnit={storageUnit} />
          ) : (
            <Link href={`/collection/storage-unit/view?id=${storageUnit.id}`}>
              <a className="storage-unit-name">
                {storageUnitDisplayName(storageUnit)}
              </a>
            </Link>
          )}
          {!disabled && (
            <FormikButton
              className="select-storage btn btn-primary btn-sm"
              onClick={() => onSelect?.(storageUnit)}
            >
              <DinaMessage id="select" />
            </FormikButton>
          )}
        </div>
        {isOpen && (
          <StorageTreeList
            parentId={storageUnit.id}
            onSelect={onSelect}
            disabled={disabled}
          />
        )}
      </div>
    </div>
  );
}
