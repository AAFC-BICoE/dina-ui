import { BULK_EDIT_IDS_KEY, useQuery, withResponse } from "common-ui";
import { PersistedResource } from "kitsu";
import { useRouter } from "next/router";
import {
  Head,
  Nav,
  storageUnitDisplayName,
  StorageUnitForm
} from "../../../components";
import { DinaMessage, useDinaIntl } from "../../../intl/dina-ui-intl";
import { StorageUnit } from "../../../types/collection-api";
import { writeStorage } from "@rehooks/local-storage";

export function useStorageUnit(id?: string) {
  return useQuery<StorageUnit>(
    {
      path: `collection-api/storage-unit/${id}`,
      include: "storageUnitType,parentStorageUnit"
    },
    {
      disabled: !id,
      // parentStorageUnit must be fetched separately to include its hierarchy:
      joinSpecs: [
        {
          apiBaseUrl: "/collection-api",
          idField: "parentStorageUnit.id",
          joinField: "parentStorageUnit",
          path: (storageUnit) =>
            `storage-unit/${storageUnit.parentStorageUnit?.id}?include=hierarchy`
        }
      ]
    }
  );
}

export default function StorageUnitEditPage() {
  const router = useRouter();
  const { formatMessage } = useDinaIntl();
  const id = router.query.id?.toString();
  const parentId = router.query.parentId?.toString();

  const storageUnitQuery = useStorageUnit(id);

  const initialParentStorageUnitQuery = useStorageUnit(parentId);

  const title = id ? "editStorageUnitTitle" : "addStorageUnitTitle";

  async function goToViewPage(resources: PersistedResource<StorageUnit>[]) {
    const ids = resources.map((resource) => resource.id);

    if (resources.length === 1) {
      await router.push(`/collection/storage-unit/view?id=${resources[0].id}`);
    } else {
      writeStorage<string[]>(BULK_EDIT_IDS_KEY, ids);
      await router.push(`/collection/storage-unit/bulk-result`);
    }
  }

  return (
    <div>
      <Head title={formatMessage(title)} />
      <Nav />
      <div className="container">
        <h1 id="wb-cont">
          <DinaMessage id={title} />
        </h1>
        {id ? (
          withResponse(storageUnitQuery, ({ data }) => (
            <>
              <Head title={storageUnitDisplayName(data)} />
              <StorageUnitForm storageUnit={data} onSaved={goToViewPage} />
            </>
          ))
        ) : parentId ? (
          withResponse(
            initialParentStorageUnitQuery,
            ({ data: initialParent }) => (
              <StorageUnitForm
                initialParent={initialParent}
                onSaved={goToViewPage}
                parentIdInURL={parentId}
              />
            )
          )
        ) : (
          <StorageUnitForm onSaved={goToViewPage} />
        )}
      </div>
    </div>
  );
}
