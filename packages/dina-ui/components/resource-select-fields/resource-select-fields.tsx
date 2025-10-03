import {
  ResourceSelectField,
  ResourceSelectFieldProps,
  SimpleSearchFilterBuilder,
  useAccount,
  useAutocompleteSearchButFallbackToRsqlApiSearch
} from "common-ui";
import { SetOptional } from "type-fest";
import { useAddPersonModal } from "..";
import { DinaMessage } from "../../intl/dina-ui-intl";
import {
  CollectingEvent,
  Collection,
  Institution,
  PreparationMethod,
  PreparationType,
  Project,
  Protocol,
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
      filter={(searchValue: string) =>
        SimpleSearchFilterBuilder.create<CollectionMethod>()
          .searchFilter("name", searchValue)
          .build()
      }
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

  return (
    <ResourceSelectField<Collection>
      key={String(isAdmin)}
      readOnlyLink="/collection/collection/view?id="
      filter={(searchValue: string) =>
        SimpleSearchFilterBuilder.create<Collection>()
          .searchFilter("name", searchValue)
          .when(!isAdmin, (builder) => builder.whereIn("group", groupNames))
          .build()
      }
      model="collection-api/collection"
      optionLabel={(coll) =>
        `${coll.name || coll.id}${coll.code ? ` (${coll.code})` : ""}`
      }
      cannotBeChanged={
        props.cannotBeChanged === undefined ? true : props.cannotBeChanged
      }
      omitNullOption={
        props.omitNullOption === undefined ? true : props.omitNullOption
      }
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
      filter={(searchValue: string) =>
        SimpleSearchFilterBuilder.create<Institution>()
          .searchFilter("name", searchValue)
          .build()
      }
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
      filter={(searchValue: string) =>
        SimpleSearchFilterBuilder.create<Person>()
          .searchFilter("displayName", searchValue)
          .build()
      }
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
  restrictedField?: string;
  restrictedFieldValue?: string;
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
      readOnlyLink="/collection/storage-unit/view?id="
      filter={(searchValue: string) =>
        SimpleSearchFilterBuilder.create<StorageUnit>()
          .searchFilter("name", searchValue)
          .build()
      }
      model="collection-api/storage-unit"
      optionLabel={(storageUnit) => {
        return storageUnit.name;
      }}
      {...resourceProps}
    />
  );
}

/**
 * CollectingEvent Select Field.
 */
export function CollectingEventSelectField(
  props: SetOptional<ResourceSelectFieldProps<CollectingEvent>, ProvidedProps>
) {
  const { isAdmin, groupNames } = useAccount();

  return (
    <ResourceSelectField<CollectingEvent>
      key={String(isAdmin)}
      readOnlyLink="/collection/collecting-event/view?id="
      filter={(searchValue: string) =>
        SimpleSearchFilterBuilder.create<CollectingEvent>()
          .searchFilter("dwcFieldNumber", searchValue)
          .when(!isAdmin, (builder) => builder.whereIn("group", groupNames))
          .build()
      }
      model="collection-api/collecting-event"
      optionLabel={(coll) =>
        `${
          coll.dwcFieldNumber || coll.otherRecordNumbers?.join(", ") || coll.id
        }}`
      }
      cannotBeChanged={true}
      omitNullOption={true}
      {...props}
    />
  );
}

/**
 * Protocol Select Field.
 */
export function ProtocolSelectField(
  props: SetOptional<ResourceSelectFieldProps<Protocol>, ProvidedProps>
) {
  const { isAdmin, groupNames } = useAccount();

  return (
    <ResourceSelectField<Protocol>
      filter={(searchValue: string) =>
        SimpleSearchFilterBuilder.create<Protocol>()
          .searchFilter("name", searchValue)
          .when(!isAdmin, (builder) => builder.whereIn("group", groupNames))
          .build()
      }
      model="collection-api/protocol"
      optionLabel={(protocol) => protocol.name}
      omitNullOption={false}
      readOnlyLink="/collection/protocol/view?id="
      {...props}
    />
  );
}

/**
 * PreparationType Select Field.
 */
export function PreparationTypeSelectField(
  props: SetOptional<ResourceSelectFieldProps<PreparationType>, ProvidedProps>
) {
  const { isAdmin, groupNames } = useAccount();

  return (
    <ResourceSelectField<PreparationType>
      {...props}
      model="collection-api/preparation-type"
      optionLabel={(it) => it.name}
      readOnlyLink="/collection/preparation-type/view?id="
      className="preparation-type"
      filter={(searchValue: string) =>
        SimpleSearchFilterBuilder.create<PreparationType>()
          .searchFilter("name", searchValue)
          .when(!isAdmin, (builder) => builder.whereIn("group", groupNames))
          .build()
      }
      tooltipLink={
        props.tooltipLink ??
        "https://aafc-bicoe.github.io/dina-documentation/#preparation-type"
      }
      tooltipLinkText={props.tooltipLinkText ?? "fromDinaUserGuide"}
    />
  );
}

/**
 * PreparationMethod Select Field.
 */
export function PreparationMethodSelectField(
  props: SetOptional<ResourceSelectFieldProps<PreparationMethod>, ProvidedProps>
) {
  const { isAdmin, groupNames } = useAccount();

  return (
    <ResourceSelectField<PreparationMethod>
      {...props}
      model="collection-api/preparation-method"
      optionLabel={(it) => it.name}
      readOnlyLink="/collection/preparation-method/view?id="
      className="preparation-method"
      filter={(searchValue: string) =>
        SimpleSearchFilterBuilder.create<PreparationMethod>()
          .searchFilter("name", searchValue)
          .when(!isAdmin, (builder) => builder.whereIn("group", groupNames))
          .build()
      }
      tooltipLink={
        props.tooltipLink ??
        "https://aafc-bicoe.github.io/dina-documentation/#preparation-method"
      }
      tooltipLinkText={props.tooltipLinkText ?? "fromDinaUserGuide"}
    />
  );
}

/**
 * Project Select Field.
 */
export function ProjectSelectField(
  props: SetOptional<ResourceSelectFieldProps<Project>, ProvidedProps>
) {
  const { isAdmin, groupNames } = useAccount();

  return (
    <ResourceSelectField<Project>
      isMulti={true}
      readOnlyLink="/collection/project/view?id="
      filter={(searchValue: string) =>
        SimpleSearchFilterBuilder.create<Project>()
          .searchFilter("name", searchValue)
          .when(!isAdmin, (builder) => builder.whereIn("group", groupNames))
          .build()
      }
      model={"collection-api/project"}
      optionLabel={(prj) => prj.name}
      {...props}
    />
  );
}
