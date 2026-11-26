import {
  controlledVocabularyPageUrl,
  getControlledVocabularyApi,
  getNewItemPosition,
  multilingualFieldsForForm,
  multilingualFieldsForSave,
  transformControlledVocabularyItemForForm
} from "../controlledVocabularyItemUtils";

describe("controlledVocabularyItemUtils", () => {
  it("Reads the API from ?api=, falling back to collection.", () => {
    expect(getControlledVocabularyApi({ api: "agent" })).toEqual("agent");
    expect(getControlledVocabularyApi({ api: "sequencing" })).toEqual(
      "sequencing"
    );
    expect(getControlledVocabularyApi({})).toEqual("collection");
    expect(getControlledVocabularyApi({ api: "unknown" })).toEqual(
      "collection"
    );
    // Inherited object keys aren't APIs.
    expect(getControlledVocabularyApi({ api: "toString" })).toEqual(
      "collection"
    );
  });

  it("Builds page URLs with the api param first.", () => {
    expect(
      controlledVocabularyPageUrl("/controlled-vocabulary-item/view", "agent", {
        id: "item-1"
      })
    ).toEqual("/controlled-vocabulary-item/view?api=agent&id=item-1");
    expect(
      controlledVocabularyPageUrl(
        "/controlled-vocabulary-item/edit",
        "objectstore"
      )
    ).toEqual("/controlled-vocabulary-item/edit?api=objectstore");
  });

  it("Converts the multilingual fields to the editable format.", () => {
    expect(
      multilingualFieldsForForm({
        multilingualTitle: { titles: [{ lang: "en", title: "Title" }] },
        multilingualDescription: {
          descriptions: [
            { lang: "en", desc: "English" },
            { lang: "fr", desc: "Français" }
          ]
        }
      })
    ).toEqual({
      multilingualTitle: { en: "Title" },
      multilingualDescription: { en: "English", fr: "Français" }
    });
    expect(multilingualFieldsForForm({})).toEqual({
      multilingualTitle: {},
      multilingualDescription: {}
    });
  });

  it("Converts the multilingual fields back, dropping blank values.", () => {
    expect(
      multilingualFieldsForSave({
        name: "unchanged",
        multilingualTitle: { en: "Title", fr: "  " },
        multilingualDescription: { en: "", fr: "Français" }
      })
    ).toEqual({
      name: "unchanged",
      multilingualTitle: { titles: [{ lang: "en", title: "Title" }] },
      multilingualDescription: {
        descriptions: [{ lang: "fr", desc: "Français" }]
      }
    });
  });

  it("Sets the multilingual fields to null when every value is blank.", () => {
    expect(
      multilingualFieldsForSave({
        multilingualTitle: { en: "", fr: null },
        multilingualDescription: { en: " " }
      })
    ).toEqual({ multilingualTitle: null, multilingualDescription: null });
  });

  it("Leaves missing multilingual fields alone.", () => {
    expect(multilingualFieldsForSave({ name: "name" })).toEqual({
      name: "name"
    });
  });

  it("Shows items with accepted values as a picklist on the form.", () => {
    const item = {
      id: "item-1",
      type: "controlled-vocabulary-item" as const,
      vocabularyElementType: "STRING",
      acceptedValues: ["a", "b"],
      multilingualTitle: { titles: [{ lang: "en", title: "Title" }] }
    };
    expect(transformControlledVocabularyItemForForm(item as any)).toEqual({
      ...item,
      vocabularyElementType: "PICKLIST",
      multilingualTitle: { en: "Title" },
      multilingualDescription: {}
    });
    expect(
      transformControlledVocabularyItemForForm({
        ...item,
        acceptedValues: []
      } as any).vocabularyElementType
    ).toEqual("STRING");
  });

  describe("getNewItemPosition", () => {
    function mockApiClient(ordered: boolean, lastItems: any[]) {
      return {
        get: jest.fn(async (path: string) =>
          path === "collection-api/controlled-vocabulary/vocab-1"
            ? { data: { id: "vocab-1", ordered } }
            : { data: lastItems }
        )
      };
    }

    it("Returns no position for an unordered vocabulary.", async () => {
      const apiClient = mockApiClient(false, []);
      expect(
        await getNewItemPosition(apiClient, "collection-api", "vocab-1")
      ).toBeUndefined();
      // The items aren't queried.
      expect(apiClient.get).toHaveBeenCalledTimes(1);
    });

    it("Puts the item after the highest position, even with gaps.", async () => {
      // Positions 1, 2 and 4 after a delete: the item count (3) would collide.
      const apiClient = mockApiClient(true, [{ id: "item-4", position: 4 }]);
      expect(
        await getNewItemPosition(apiClient, "collection-api", "vocab-1")
      ).toEqual(5);
      expect(apiClient.get).toHaveBeenLastCalledWith(
        "collection-api/controlled-vocabulary-item",
        {
          filter: { "controlledVocabulary.uuid": { EQ: "vocab-1" } },
          sort: "-position",
          page: { limit: 1 }
        }
      );
    });

    it("Starts at 1 in an empty ordered vocabulary.", async () => {
      expect(
        await getNewItemPosition(
          mockApiClient(true, []),
          "collection-api",
          "vocab-1"
        )
      ).toEqual(1);
    });
  });
});
