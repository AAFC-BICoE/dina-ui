import {
  filterBy,
  ResourceSelectField,
  ResourceSelectFieldProps,
  useAccount,
  useAutocompleteSearchButFallbackToRsqlApiSearch
} from "common-ui";
import { SetOptional } from "type-fest";
import { useAddPersonModal } from "..";
import { DinaMessage } from "../../intl/dina-ui-intl";
import {
  Collection,
  Institution,
  StorageUnit
} from "../../types/collection-api";
import { CollectionMethod } from "../../types/collection-api/resources/CollectionMethod";
import { Person } from "../../types/objectstore-api";
import { DinaUser } from "../../types/user-api/resources/DinaUser";

type ProvidedProps = "readOnlyLink" | "filter" | "model" | "optionLabel";

export function CollectionMethodSelectField(
  props: SetOptional<ResourceSelectFieldProps<CollectionMethod>, ProvidedProps>
) {
  return (
    <ResourceSelectField<CollectionMethod>
      readOnlyLink="/collection/collection-method/view?id="
      filter={filterBy(["name"])}
      model="collection-api/collection-method"
      optionLabel={(cm) => cm.name}
      {...props}
    />
  );
}

/** Collection Select Field. Can only be changed if there are multiple Collections to choose from. */
export function CollectionSelectField(
  props: SetOptional<ResourceSelectFieldProps<Collection>, ProvidedProps>
) {
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

  return (
    <ResourceSelectField<Collection>
      key={String(isAdmin)}
      readOnlyLink="/collection/collection/view?id="
      filter={filter}
      model="collection-api/collection"
      optionLabel={(coll) =>
        `${coll.name || coll.id}${coll.code ? ` (${coll.code})` : ""}`
      }
      cannotBeChanged={true}
      omitNullOption={true}
      {...props}
    />
  );
}

export function InstitutionSelectField(
  props: SetOptional<ResourceSelectFieldProps<Institution>, ProvidedProps>
) {
  return (
    <ResourceSelectField<Institution>
      readOnlyLink="/collection/institution/view?id="
      filter={filterBy(["name"])}
      model="collection-api/institution"
      optionLabel={(inst) => inst.name || inst.id}
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
      optionLabel={(user) => user.username}
      // TODO allow filtering by group
      filter={() => ({})}
      pageSize={1000}
      {...props}
    />
  );
}

export function PersonSelectField(
  props: SetOptional<ResourceSelectFieldProps<Person>, ProvidedProps>
) {
  const { openAddPersonModal } = useAddPersonModal();

  return (
    <ResourceSelectField<Person>
      // Experimental: try to use the dina-search-api autocomplete endpoint to get the data
      // but fallback to the regular RSQL search if that fails.
      useCustomQuery={(searchQuery, querySpec) =>
        useAutocompleteSearchButFallbackToRsqlApiSearch({
          searchQuery,
          querySpec,
          indexName: "dina_agent_index",
          searchField: "data.attributes.displayName",
          additionalField: "data.attributes.aliases"
        })
      }
      readOnlyLink="/person/view?id="
      filter={filterBy(["displayName"])}
      model="agent-api/person"
      // Show display name, and show aliases if any:
      optionLabel={(person) => {
        return person.displayName
          ? `${person.displayName}${
              person.aliases?.length ? ` (${person.aliases.join(", ")})` : ""
            }`
          : null;
      }}
      asyncOptions={[
        {
          label: <DinaMessage id="addNewPerson" />,
          getResource: openAddPersonModal
        }
      ]}
      {...props}
    />
  );
}

interface StorageUnitSelectFieldProps {
  resourceProps: SetOptional<
    ResourceSelectFieldProps<StorageUnit>,
    ProvidedProps
  >;
  restrictedField: string;
  restrictedFieldValue: string;
}

export function StorageUnitSelectField({
  resourceProps,
  restrictedField,
  restrictedFieldValue
}: StorageUnitSelectFieldProps) {
  return (
    <ResourceSelectField<StorageUnit>
      // Experimental: try to use the dina-search-api autocomplete endpoint to get the data
      // but fallback to the regular RSQL search if that fails.
      useCustomQuery={(searchQuery, querySpec) =>
        useAutocompleteSearchButFallbackToRsqlApiSearch({
          searchQuery,
          querySpec,
          indexName: "dina_storage_index",
          searchField: "data.attributes.name",
          restrictedField,
          restrictedFieldValue
        })
      }
      readOnlyLink="/storageUnit/view?id="
      filter={filterBy(["name"])}
      model="collection-api/storage-unit"
      optionLabel={(storageUnit) => {
        return storageUnit.name;
      }}
      {...resourceProps}
    />
  );
}
