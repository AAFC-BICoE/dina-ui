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
import { DinaUser } from "../../types/user-api/resources/DinaUser";
import { SetOptional } from "type-fest";

type ProvidedProps = "readOnlyLink" | "filter" | "model" | "optionLabel";

export function CollectionMethodSelectField(
  props: SetOptional<ResourceSelectFieldProps<CollectionMethod>, ProvidedProps>
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
  props: SetOptional<ResourceSelectFieldProps<Collection>, ProvidedProps>
) {
  const [{ value }] = useField(props.name);
  const { isAdmin, groupNames } = useAccount();

  const filter = filterBy(
    ["name"],
    !isAdmin
      ? {
          extraFilters: [
            // Restrict the list to just the user's groups:
            {
              selector: "group",
              comparison: "=in=",
              arguments: groupNames || []
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
      !isAdmin && meta?.totalResourceCount === 1 && data[0].id === value?.id;

    return (
      <ResourceSelectField<Collection>
        key={String(isAdmin)}
        readOnlyLink="/collection/collection/view?id="
        filter={filter}
        model="collection-api/collection"
        optionLabel={coll =>
          `${coll.name || coll.id}${coll.code ? ` (${coll.code})` : ""}`
        }
        isDisabled={collectionCannotBeChanged}
        omitNullOption={true}
        {...props}
      />
    );
  });
}

export function InstitutionSelectField(
  props: SetOptional<ResourceSelectFieldProps<Institution>, ProvidedProps>
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

export function UserSelectField(
  props: SetOptional<ResourceSelectFieldProps<DinaUser>, ProvidedProps>
) {
  return (
    <ResourceSelectField<DinaUser>
      readOnlyLink="/dina-user/view?id="
      model="user-api/user"
      optionLabel={user => user.username}
      // TODO allow filtering by group
      filter={() => ({})}
      pageSize={1000}
      {...props}
    />
  );
}
