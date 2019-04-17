import { KitsuResource } from "kitsu";
import { serialize } from "../serialize";

interface Person extends KitsuResource {
  name?: string;
  relatedPerson?: Person;
  links?: any;
  relationships?: any;
}

interface Keyboard extends KitsuResource {
  name: string;
  type: string;
}

describe("serialize function", () => {
  it("Serializes a resource to JSONAPI format.", async () => {
    const resource: Person = {
      name: "Mat",
      relatedPerson: { id: "10", type: "person" },
      type: "person"
    };

    const serialized = await serialize({ resource, type: "person" });

    expect(serialized).toEqual({
      attributes: {
        name: "Mat"
      },
      relationships: {
        relatedPerson: {
          data: {
            id: "10",
            type: "person"
          }
        }
      },
      type: "person"
    });
  });

  it("Removes the 'links' and 'relationships' attributes when serializing.", async () => {
    const resource: Person = {
      id: "1",
      links: {
        self: "http://example.com/people/1"
      },
      name: "Mat",
      relationships: {},
      type: "person"
    };

    const serialized = await serialize({ resource, type: "person" });

    expect(serialized).toEqual({
      attributes: {
        name: "Mat"
      },
      id: "1",
      type: "person"
    });
  });

  it("Allows the resource to have an attribute called 'type' that is separate from the JSONAPI resource type.", async () => {
    const resource: Keyboard = {
      id: "5",
      name: "azio",
      type: "plastic"
    };

    const serialized = await serialize({ resource, type: "keyboard" });

    expect(serialized).toEqual({
      attributes: {
        name: "azio",
        type: "plastic"
      },
      id: "5",
      type: "keyboard"
    });
  });
});
