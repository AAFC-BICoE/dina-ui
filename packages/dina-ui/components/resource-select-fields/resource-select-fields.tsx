import {
  filterBy,
  ResourceSelectField,
  ResourceSelectFieldProps
} from "common-ui";
import { Collection, Institution } from "../../types/collection-api";
import { CollectionMethod } from "../../types/collection-api/resources/CollectionMethod";

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

export function CollectionSelectField(
  props: Omit<ResourceSelectFieldProps<Collection>, OmittedProps>
) {
  return (
    <ResourceSelectField<Collection>
      readOnlyLink="/collection/collection/view?id="
      filter={filterBy(["name"])}
      model="collection-api/collection"
      optionLabel={coll =>
        `${coll.name || coll.id}${coll.code ? ` (${coll.code})` : ""}`
      }
      {...props}
    />
  );
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
