import {
  controlledVocabularyPageUrl,
  getControlledVocabularyApi,
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
});
