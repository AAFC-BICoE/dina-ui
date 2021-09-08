import {
  filterBy,
  MetaWithTotal,
  ResourceSelectField,
  ResourceSelectFieldProps,
  useAccount,
  useQuery,
  withResponse
} from "common-ui";
import { Collection, Institution } from "../../types/collection-api";
import { CollectionMethod } from "../../types/collection-api/resources/CollectionMethod";
import { useField } from "formik";

type OmittedProps = "readOnlyLink" | "filter" | "model" | "optionLabel";

export function CollectionMethodSelectField(
  props: Omit<ResourceSelectFieldProps<CollectionMethod>, OmittedProps>
) {
  return (
    <ResourceSelectField<CollectionMethod>
      readOnlyLink="/collection/collection-method/view?id="
      filter={filterBy(["name"])}
      model="collection-api/collection-method"
      optionLabel={cm => cm.name}
      {...props}
    />
  );
}

/** Collection Select Field. Can only be changed if there are multiple Collections to choose from. */
export function CollectionSelectField(
  props: Omit<ResourceSelectFieldProps<Collection>, OmittedProps>
) {
  const [{ value }] = useField(props.name);
  const { roles, groupNames } = useAccount();

  const filter = filterBy(
    ["name"],
    !roles.includes("dina-admin")
      ? {
          extraFilters: [
            // Restrict the list to just the user's groups:
            {
              selector: "group",
              comparison: "=in=",
              arguments: (groupNames || []).join(",")
            }
          ]
        }
      : undefined
  );

  const collectionQuery = useQuery<Collection[], MetaWithTotal>({
    path: "collection-api/collection",
    filter: filter("")
  });

  return withResponse(collectionQuery, ({ data, meta }) => {
    // Disable this input when the collection set is the only one available:
    const collectionCannotBeChanged =
      !roles.includes("dina-admin") &&
      meta?.totalResourceCount === 1 &&
      data[0].id === value?.id;

    return (
      <ResourceSelectField<Collection>
        readOnlyLink="/collection/collection/view?id="
        filter={filter}
        model="collection-api/collection"
        optionLabel={coll =>
          `${coll.name || coll.id}${coll.code ? ` (${coll.code})` : ""}`
        }
        isDisabled={collectionCannotBeChanged}
        {...props}
      />
    );
  });
}

export function InstitutionSelectField(
  props: Omit<ResourceSelectFieldProps<Institution>, OmittedProps>
) {
  return (
    <ResourceSelectField<Institution>
      readOnlyLink="/collection/institution/view?id="
      filter={filterBy(["name"])}
      model="collection-api/institution"
      optionLabel={inst => inst.name || inst.id}
      {...props}
    />
  );
}
