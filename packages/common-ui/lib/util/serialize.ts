import { ResourceObject } from "jsonapi-typescript";
import { KitsuResource } from "kitsu";
import { kebab, serialise } from "kitsu-core";

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
}: SerializeParams<TData>): Promise<ResourceObject> {
  // Create a copy of the resource so the original is not affected, and omit "undefined" values.
  const resourceCopy = JSON.parse(JSON.stringify(resource));

  // Delete the "meta" property which can't be re-sent to the back-end:
  delete resourceCopy.meta;

  // Get rid of undefined IDs, which can cause errors:
  if (typeof resourceCopy.id === "undefined") {
    delete resourceCopy.id;
  }

  // kitsu's serializer doesn't handle relationships that have been set to null.
  // Handle them manually here, where { id: null } counts as a null relationship.
  const nullRelationships = getNullRelationships(resourceCopy);

  // Delete the "links" attribute, which is sometimes included by back-ends like Crnk.
  // The "links" and "relationships" attributes are not supported by kitsu-core's serializer, so
  // we remove themhere.
  delete (resourceCopy as any).links;
  const origRelationship = (resourceCopy as any).relationships;
  delete (resourceCopy as any).relationships;

  const nestedObjects = getNestedObjects(resourceCopy);

  const httpVerb = resource.id ? "PATCH" : "POST";

  const { data } = await customSerialise(type, resourceCopy, httpVerb);

  // Add the attributes object if it is missing.
  if (!data.attributes) {
    data.attributes = {};
  }

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

  data.attributes = { ...data.attributes, ...nestedObjects };
  if (origRelationship && Object.keys(origRelationship).length !== 0)
    data.relationships = { ...data.relationships, ...origRelationship };

  return data;
}

/**
 * Gets the null relationships from the submitted KitsuResource, where { id: null } counts as
 * a null relationship, and removes those { id: null } values from the given resource.
 * The returned value is a JSONAPI relationships object.
 */
function getNullRelationships(resource: KitsuResource) {
  const nullRelationshipFields = Object.keys(resource).filter(
    (key) => resource[key]?.id === null
  );
  const nullRelationships = {};
  for (const field of nullRelationshipFields) {
    delete resource[field];
    nullRelationships[field] = { data: null };
  }
  return nullRelationships;
}

function getNestedObjects(resource: KitsuResource) {
  const nestedObjectFields = Object.keys(resource).filter(
    (key) =>
      Object(resource[key]) === resource[key] && resource[key]?.id === undefined
  );
  const nestedObjects: { [key: string]: any } = {};
  for (const field of nestedObjectFields) {
    nestedObjects[field] = resource[field];
    delete resource[field];
  }
  return nestedObjects;
}
