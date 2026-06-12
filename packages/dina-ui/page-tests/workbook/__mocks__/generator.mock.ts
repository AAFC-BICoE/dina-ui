import {
  ControlledVocabularyItem,
  Vocabulary
} from "packages/dina-ui/types/collection-api";

export const TEST_CONTROLLED_VOCABULARY_ITEM_MATERIAL_SAMPLE: ControlledVocabularyItem =
  {
    id: "0192ba73-340a-72b1-bea9-fc75cdcaf7c6",
    type: "controlled-vocabulary-item",
    name: "my test managed attribute",
    key: "my_test_managed_attribute",
    vocabularyElementType: "STRING",
    dinaComponent: "MATERIAL_SAMPLE",
    createdOn: "2024-10-23T17:36:05.296422Z",
    createdBy: "dina-admin",
    group: "aafc",
    multilingualDescription: {
      descriptions: []
    }
  };

export const TEST_CONTROLLED_VOCABULARY_ITEM_PREPARATION: ControlledVocabularyItem =
  {
    id: "0192e83f-e198-7fd8-b7e9-d7a24e11c683",
    type: "controlled-vocabulary-item",
    name: "Test Preparation Managed Attribute",
    key: "test_preparation_managed_attribute",
    vocabularyElementType: "STRING",
    dinaComponent: "PREPARATION",
    createdOn: "2024-10-23T17:36:05.296422Z",
    createdBy: "dina-admin",
    group: "aafc",
    multilingualDescription: {
      descriptions: []
    }
  };

export const TEST_CONTROLLED_VOCABULARY_ITEM_COLLECTING_EVENT: ControlledVocabularyItem =
  {
    id: "0679a2cd-80e8-4fc7-bcfa-ca13e0892354",
    type: "controlled-vocabulary-item",
    name: "Test Collecting Event Managed Attribute",
    key: "test_collecting_event_managed_attribute",
    vocabularyElementType: "STRING",
    dinaComponent: "COLLECTING_EVENT",
    createdOn: "2024-10-23T17:36:05.296422Z",
    createdBy: "dina-admin",
    group: "aafc",
    multilingualDescription: {
      descriptions: []
    }
  };

export const TEST_CLASSIFICATIONS: Vocabulary = {
  id: "taxonomicRank",
  type: "vocabulary",
  vocabularyElements: [
    {
      key: "kingdom",
      name: "kingdom",
      multilingualTitle: {
        titles: [
          {
            lang: "en",
            title: "kingdom"
          },
          {
            lang: "fr",
            title: "règne"
          }
        ]
      }
    },
    {
      key: "phylum",
      name: "phylum",
      multilingualTitle: {
        titles: [
          {
            lang: "en",
            title: "phylum"
          },
          {
            lang: "fr",
            title: "phylum"
          }
        ]
      }
    },
    {
      key: "class",
      name: "class",
      multilingualTitle: {
        titles: [
          {
            lang: "en",
            title: "class"
          },
          {
            lang: "fr",
            title: "classe"
          }
        ]
      }
    },
    {
      key: "order",
      name: "order",
      multilingualTitle: {
        titles: [
          {
            lang: "en",
            title: "order"
          },
          {
            lang: "fr",
            title: "ordre"
          }
        ]
      }
    },
    {
      key: "family",
      name: "family",
      multilingualTitle: {
        titles: [
          {
            lang: "en",
            title: "family"
          },
          {
            lang: "fr",
            title: "famille"
          }
        ]
      }
    },
    {
      key: "genus",
      name: "genus",
      multilingualTitle: {
        titles: [
          {
            lang: "en",
            title: "genus"
          },
          {
            lang: "fr",
            title: "genre"
          }
        ]
      }
    },
    {
      key: "species",
      name: "species",
      multilingualTitle: {
        titles: [
          {
            lang: "en",
            title: "species"
          },
          {
            lang: "fr",
            title: "espèce"
          }
        ]
      }
    },
    {
      key: "subspecies",
      name: "subspecies",
      multilingualTitle: {
        titles: [
          {
            lang: "en",
            title: "subspecies"
          },
          {
            lang: "fr",
            title: "sous-espèce"
          }
        ]
      }
    },
    {
      key: "variety",
      name: "variety",
      multilingualTitle: {
        titles: [
          {
            lang: "en",
            title: "variety"
          },
          {
            lang: "fr",
            title: "variété"
          }
        ]
      }
    }
  ]
};
