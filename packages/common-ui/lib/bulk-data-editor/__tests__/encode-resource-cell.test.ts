import {
  decodeResourceCell,
  encodeResourceCell
} from "../encode-resource-cell";

describe("encode-resource-cell", () => {
  it("encodes a resource as a string.", () => {
    const agent = {
      id: "6cae3e9b-62e8-44ef-8219-60ab2e2f6898",
      name: "Mat",
      type: "agent"
    };

    const encoded = encodeResourceCell(agent, {
      label: agent.name
    });

    expect(encoded).toEqual("Mat (agent/6cae3e9b-62e8-44ef-8219-60ab2e2f6898)");
  });

  it("Uses the resource's type when none is specified manually.", () => {
    const agent = {
      id: "6cae3e9b-62e8-44ef-8219-60ab2e2f6898",
      name: "Mat",
      type: "agent"
    };

    const encoded = encodeResourceCell(agent, {
      label: agent.name
    });

    expect(encoded).toEqual("Mat (agent/6cae3e9b-62e8-44ef-8219-60ab2e2f6898)");
  });

  it("encodes a null as a blank string.", () => {
    const encoded = encodeResourceCell(null, {
      label: "test label",
      type: "test type"
    });

    expect(encoded).toEqual("");
  });

  it("decodes a string to a resource.", () => {
    const encoded = "Mat (agent/6cae3e9b-62e8-44ef-8219-60ab2e2f6898)";

    const decoded = decodeResourceCell(encoded);

    expect(decoded).toEqual({
      id: "6cae3e9b-62e8-44ef-8219-60ab2e2f6898",
      type: "agent"
    });
  });

  it("returns { id: null } if the end of the string is not an identifier.", () => {
    // Add a space after the identifier:
    const encoded = "Mat (agent/6cae3e9b-62e8-44ef-8219-60ab2e2f6898) ";

    const decoded = decodeResourceCell(encoded);

    expect(decoded).toEqual({ id: null });
  });

  it("returns { id: null } if the string is formatted wrong.", () => {
    const encoded = "sfsfgsdgsdgsdgd";

    const decoded = decodeResourceCell(encoded);

    expect(decoded).toEqual({ id: null });
  });
});
