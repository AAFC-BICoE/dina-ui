import { mountWithAppContext } from "common-ui";
import { waitFor } from "@testing-library/react";
import "@testing-library/jest-dom";
import { ControlledVocabularyViewer } from "../ControlledVocabularyViewer";

const EXAMPLE_CV_ITEM_1 = {
  id: "1",
  type: "controlled-vocabulary-item",
  key: "attribute_1",
  name: "Attribute 1",
  multilingualTitle: {
    titles: [
      { lang: "en", title: "Attribute One" },
      { lang: "fr", title: "Attribut Un" }
    ]
  },
  multilingualDescription: {
    descriptions: [
      { lang: "en", desc: "Description for attribute one" },
      { lang: "fr", desc: "Description pour attribut un" }
    ]
  }
};

const EXAMPLE_CV_ITEM_2 = {
  id: "2",
  type: "controlled-vocabulary-item",
  key: "attribute_2",
  name: "Attribute 2",
  multilingualTitle: {
    titles: [
      { lang: "en", title: "Attribute Two" },
      { lang: "fr", title: "Attribut Deux" }
    ]
  },
  multilingualDescription: {
    descriptions: [{ lang: "en", desc: "Description for attribute two" }]
  }
};

const EXAMPLE_CV_ITEM_3 = {
  id: "3",
  type: "controlled-vocabulary-item",
  key: "attribute_3",
  name: "Attribute 3",
  multilingualTitle: {
    titles: [{ lang: "en", title: "Zebra Attribute" }]
  },
  multilingualDescription: {
    descriptions: []
  }
};

const TEST_BASE_API = "collection-api";
const TEST_DINA_COMPONENT = "MATERIAL_SAMPLE";
const TEST_CV_UUID = "test-controlled-vocabulary-uuid";

const mockGet = jest.fn<any, any>(async (path, params) => {
  if (path === `${TEST_BASE_API}/controlled-vocabulary-item`) {
    const keyFilter = params?.filter?.key?.EQ;
    switch (keyFilter) {
      case "attribute_1":
        return { data: [EXAMPLE_CV_ITEM_1] };
      case "attribute_2":
        return { data: [EXAMPLE_CV_ITEM_2] };
      case "attribute_3":
        return { data: [EXAMPLE_CV_ITEM_3] };
      default:
        return { data: [] };
    }
  }
  return { data: [] };
});

const apiContext = {
  apiClient: {
    get: mockGet
  }
};

describe("ControlledVocabularyViewer", () => {
  beforeEach(jest.clearAllMocks);

  it("Makes one API request per value key with the correct filters", async () => {
    const values = {
      attribute_1: "value-one",
      attribute_2: "value-two"
    };

    mountWithAppContext(
      <ControlledVocabularyViewer
        values={values}
        baseApi={TEST_BASE_API}
        dinaComponent={TEST_DINA_COMPONENT}
        controlledVocabularyUUID={TEST_CV_UUID}
      />,
      { apiContext }
    );

    await waitFor(() => {
      expect(mockGet).toHaveBeenCalledWith(
        `${TEST_BASE_API}/controlled-vocabulary-item`,
        expect.objectContaining({
          filter: expect.objectContaining({
            key: { EQ: "attribute_1" },
            dinaComponent: { EQ: TEST_DINA_COMPONENT },
            "controlledVocabulary.uuid": { EQ: TEST_CV_UUID }
          }),
          page: { limit: 1 }
        })
      );

      expect(mockGet).toHaveBeenCalledWith(
        `${TEST_BASE_API}/controlled-vocabulary-item`,
        expect.objectContaining({
          filter: expect.objectContaining({
            key: { EQ: "attribute_2" },
            dinaComponent: { EQ: TEST_DINA_COMPONENT },
            "controlledVocabulary.uuid": { EQ: TEST_CV_UUID }
          }),
          page: { limit: 1 }
        })
      );

      // One call per key, no more.
      expect(mockGet).toHaveBeenCalledTimes(2);
    });
  });

  it("Renders the multilingualTitle and value for each loaded item", async () => {
    const values = {
      attribute_1: "value-one",
      attribute_2: "value-two"
    };

    const { getByText } = mountWithAppContext(
      <ControlledVocabularyViewer
        values={values}
        baseApi={TEST_BASE_API}
        dinaComponent={TEST_DINA_COMPONENT}
        controlledVocabularyUUID={TEST_CV_UUID}
      />,
      { apiContext }
    );

    // Labels resolved from multilingualTitle for the "en" locale.
    await waitFor(() => {
      expect(getByText("Attribute One")).toBeInTheDocument();
      expect(getByText("Attribute Two")).toBeInTheDocument();
    });

    // Values passed in are rendered.
    expect(getByText("value-one")).toBeInTheDocument();
    expect(getByText("value-two")).toBeInTheDocument();
  });

  it("Renders entries sorted alphabetically by resolved title", async () => {
    const values = {
      attribute_3: "value-three",
      attribute_1: "value-one",
      attribute_2: "value-two"
    };

    const { container } = mountWithAppContext(
      <ControlledVocabularyViewer
        values={values}
        baseApi={TEST_BASE_API}
        dinaComponent={TEST_DINA_COMPONENT}
        controlledVocabularyUUID={TEST_CV_UUID}
      />,
      { apiContext }
    );

    await waitFor(() => {
      const fieldHeaders = container.querySelectorAll(".field-label strong");
      expect(fieldHeaders).toHaveLength(3);

      const titles = Array.from(fieldHeaders).map((el) =>
        el.textContent?.trim()
      );

      expect(titles).toEqual([
        "Attribute One",
        "Attribute Two",
        "Zebra Attribute"
      ]);
    });
  });

  it("Omits the dinaComponent filter when it is not provided", async () => {
    const values = { attribute_1: "value-one" };

    mountWithAppContext(
      <ControlledVocabularyViewer
        values={values}
        baseApi={TEST_BASE_API}
        controlledVocabularyUUID={TEST_CV_UUID}
        // dinaComponent omitted
      />,
      { apiContext }
    );

    await waitFor(() => {
      const [, params] = mockGet.mock.calls[0];
      expect(params.filter).not.toHaveProperty("dinaComponent");
    });
  });
});
