import { KitsuResource } from "kitsu";
import { kebab, serialise } from "kitsu-core";
import { JsonApiResource } from "../components/api-client/jsonapi-types";

/** Params for the serialize util function. */
interface SerializeParams<TData extends KitsuResource> {
  /** The resource. */
  resource: TData;

  /** The resource type. */
  type: string;
}

const skip = (s: any) => s;

// Bind the serialise function with the default case config.
const customSerialise = serialise.bind({
  camel: skip,
  plural: skip,
  resCase: kebab
});

/**
 * Converts a resource from Kitsu format to JSONAPI format.
 *
 * See: https://github.com/wopian/kitsu/tree/master/packages/kitsu-core#examples-1
 */
export async function serialize<TData extends KitsuResource>({
  resource,
  type
}: SerializeParams<TData>): Promise<JsonApiResource> {
  // Create a copy of the resource so the original is not affected.
  const resourceCopy = { ...resource };

  // kitsu's serializer doesn't handle relationships that have been set to null.
  // Handle them manually here, where { id: null } counts as a null relationship.
  const nullRelationships = getNullRelationships(resourceCopy);

  // Delete the "links" attribute, which is sometimes included by back-ends like Crnk.
  // The "links" and "relationships" attributes are not supported by kitsu-core's serializer, so
  // we remove themhere.
  delete (resourceCopy as any).links;
  delete (resourceCopy as any).relationships;

  const httpVerb = resource.id ? "PATCH" : "POST";

  const { data } = await customSerialise(type, resourceCopy, httpVerb);

  // Some resource types (e.g. PcrPrimer) have an attribute called "type", which is separate from
  // the JSONAPI resource type.
  // kitsu-core's serializer ignores attributes called "type", so we manually add it back here if it exists.
  if (resourceCopy.type !== type) {
    data.attributes.type = resourceCopy.type;
  }

  // Add the null relationships to the JSONAPI document if there are any.
  if (Object.keys(nullRelationships).length) {
    data.relationships = { ...data.relationships, ...nullRelationships };
  }

  return data;
}

/**
 * Gets the null relationships from the submitted KitsuResource, where { id: null } counts as
 * a null relationship, and removes those { id: null } values from the given resource.
 * The returned value is a JSONAPI relationships object.
 */
function getNullRelationships(resource: KitsuResource) {
  const nullRelationshipFields = Object.keys(resource).filter(
    key => resource[key] && resource[key].id === null
  );
  const nullRelationships = {};
  for (const field of nullRelationshipFields) {
    delete resource[field];
    nullRelationships[field] = { data: null };
  }
  return nullRelationships;
}
