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

  return data;
}
