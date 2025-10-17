import { BULK_EDIT_IDS_KEY, useQuery, withResponse } from "common-ui";
import { PersistedResource } from "kitsu";
import { useRouter } from "next/router";
import {
  Head,
  storageUnitDisplayName,
  StorageUnitForm
} from "../../../components";
import { StorageUnit } from "../../../types/collection-api";
import { writeStorage } from "@rehooks/local-storage";
import PageLayout from "../../../components/page/PageLayout";

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
            `storage-unit/${storageUnit.parentStorageUnit?.id}`
        }
      ]
    }
  );
}

export default function StorageUnitEditPage() {
  const router = useRouter();
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
    <PageLayout titleId={title}>
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
    </PageLayout>
  );
}
