import { MaterialSampleSummary } from "../../../../types/collection-api";
import { PcrBatchItem } from "../../../../types/seqdb-api";

/**
 * This mock data can be used to display a 6 by 5 PCR plate (30 records in total)
 *
 * <pre>
 *      1  2  3  4  5
 *   |---------------
 * A |  x  x  x  x  x  <-- Good band
 * B |  x  x  x  x  x  <-- Weak band
 * C |  x  x  x  x  x  <-- Multiple band
 * D |  x  x  x  x  x  <-- Contaminated
 * E |  x  x  x  x  x  <-- Smear
 * F |  x  x  x  x  x  <-- No band set or custom
 * </pre>
 */
export const PCR_BATCH_ITEMS: PcrBatchItem[] = [
  {
    id: "bd9f5541-9fe4-43bb-bc42-c2ec647da9d6",
    type: "pcr-batch-item",
    materialSample: {
      id: "53c8dd5c-a287-41d7-8a30-e1ea26580e7e",
      type: "material-sample"
    },
    createdBy: "dina-admin",
    createdOn: "2023-04-20T12:51:39.770718Z",
    group: "aafc",
    result: "Good Band",
    storageUnitUsage: {
      id: "storage-unit-usage-1",
      type: "storage-unit-usage",
      wellRow: "A",
      wellColumn: 1,
      cellNumber: 1
    }
  },
  {
    id: "b5e12e85-84d4-461d-8cce-f2fa3af4644b",
    type: "pcr-batch-item",
    materialSample: {
      id: "b7e464a8-7715-4742-b0bb-6b826bd054fb",
      type: "material-sample"
    },
    createdBy: "dina-admin",
    createdOn: "2023-04-20T12:51:39.770718Z",
    group: "aafc",
    result: "Good Band",
    storageUnitUsage: {
      id: "storage-unit-usage-2",
      type: "storage-unit-usage",
      wellRow: "A",
      wellColumn: 2,
      cellNumber: 2
    }
  },
  {
    id: "80e5b586-ff3f-4be7-b30c-ea4671cddc97",
    type: "pcr-batch-item",
    materialSample: {
      id: "c40ba07d-57f3-4461-92de-2735b3533e8a",
      type: "material-sample"
    },
    createdBy: "dina-admin",
    createdOn: "2023-04-20T12:51:39.770718Z",
    group: "aafc",
    result: "Good Band",
    storageUnitUsage: {
      id: "storage-unit-usage-3",
      type: "storage-unit-usage",
      wellRow: "A",
      wellColumn: 3,
      cellNumber: 3
    }
  },
  {
    id: "2dc0ccb3-abc1-4a01-9afd-60ec448d101e",
    type: "pcr-batch-item",
    materialSample: {
      id: "99e732dd-e755-43ef-8158-5a8dcf9c4239",
      type: "material-sample"
    },
    createdBy: "dina-admin",
    createdOn: "2023-04-20T12:51:39.770718Z",
    group: "aafc",
    result: "Good Band",
    storageUnitUsage: {
      id: "storage-unit-usage-4",
      type: "storage-unit-usage",
      wellRow: "A",
      wellColumn: 4,
      cellNumber: 4
    }
  },
  {
    id: "6da5ebfe-d257-4d62-aa6b-99419d5864f3",
    type: "pcr-batch-item",
    materialSample: {
      id: "863431e7-7465-4347-9854-8c1729b46d4c",
      type: "material-sample"
    },
    createdBy: "dina-admin",
    createdOn: "2023-04-20T12:51:39.770718Z",
    group: "aafc",
    result: "Good Band",
    storageUnitUsage: {
      id: "storage-unit-usage-5",
      type: "storage-unit-usage",
      wellRow: "A",
      wellColumn: 5,
      cellNumber: 5
    }
  },
  {
    id: "93434a71-e608-4e3b-bda3-27bd7fa8a589",
    type: "pcr-batch-item",
    materialSample: {
      id: "102e35ee-f5bc-4403-bf09-3d8fd8d33ddc",
      type: "material-sample"
    },
    createdBy: "dina-admin",
    createdOn: "2023-04-20T12:51:39.770718Z",
    group: "aafc",
    result: "Weak Band",
    storageUnitUsage: {
      id: "storage-unit-usage-6",
      type: "storage-unit-usage",
      wellRow: "B",
      wellColumn: 1,
      cellNumber: 6
    }
  },
  {
    id: "c3760849-7886-4a26-abf9-76734f9cd40d",
    type: "pcr-batch-item",
    materialSample: {
      id: "286375f6-32cc-4d8b-8303-75c9830f761d",
      type: "material-sample"
    },
    createdBy: "dina-admin",
    createdOn: "2023-04-20T12:51:39.770718Z",
    group: "aafc",
    result: "Weak Band",
    storageUnitUsage: {
      id: "storage-unit-usage-7",
      type: "storage-unit-usage",
      wellRow: "B",
      wellColumn: 2,
      cellNumber: 7
    }
  },
  {
    id: "bc27b891-d54a-4419-baa1-2f57c6395c9a",
    type: "pcr-batch-item",
    materialSample: {
      id: "c54932e4-1d6a-42b2-8d6d-4b608be7e3dd",
      type: "material-sample"
    },
    createdBy: "dina-admin",
    createdOn: "2023-04-20T12:51:39.770718Z",
    group: "aafc",
    result: "Weak Band",
    storageUnitUsage: {
      id: "storage-unit-usage-8",
      type: "storage-unit-usage",
      wellRow: "B",
      wellColumn: 3,
      cellNumber: 8
    }
  },
  {
    id: "3a7bb639-9b12-4edd-8074-a0bd1d4ca453",
    type: "pcr-batch-item",
    materialSample: {
      id: "31380b5c-69a7-40eb-8d16-8006961d1bed",
      type: "material-sample"
    },
    createdBy: "dina-admin",
    createdOn: "2023-04-20T12:51:39.770718Z",
    group: "aafc",
    result: "Weak Band",
    storageUnitUsage: {
      id: "storage-unit-usage-9",
      type: "storage-unit-usage",
      wellRow: "B",
      wellColumn: 4,
      cellNumber: 9
    }
  },
  {
    id: "3dc808d6-a958-448f-8743-71b837fc2224",
    type: "pcr-batch-item",
    materialSample: {
      id: "8a5ae1d0-da78-4f36-b252-c126b79dc465",
      type: "material-sample"
    },
    createdBy: "dina-admin",
    createdOn: "2023-04-20T12:51:39.770718Z",
    group: "aafc",
    result: "Weak Band",
    storageUnitUsage: {
      id: "storage-unit-usage-10",
      type: "storage-unit-usage",
      wellRow: "B",
      wellColumn: 5,
      cellNumber: 10
    }
  },
  {
    id: "688f20a3-1e6f-4731-95f6-668c860ac4a5",
    type: "pcr-batch-item",
    materialSample: {
      id: "32f64502-2856-4bc2-b32a-8977d7a0cc93",
      type: "material-sample"
    },
    createdBy: "dina-admin",
    createdOn: "2023-04-20T12:51:39.770718Z",
    group: "aafc",
    result: "Multiple Bands",
    storageUnitUsage: {
      id: "storage-unit-usage-11",
      type: "storage-unit-usage",
      wellRow: "C",
      wellColumn: 1,
      cellNumber: 11
    }
  },
  {
    id: "d82400db-8bf7-4948-87f4-c79bd66e7833",
    type: "pcr-batch-item",
    materialSample: {
      id: "ac6c2712-bfb2-4e93-a4ce-0270bad5d439",
      type: "material-sample"
    },
    createdBy: "dina-admin",
    createdOn: "2023-04-20T12:51:39.770718Z",
    group: "aafc",
    result: "Multiple Bands",
    storageUnitUsage: {
      id: "storage-unit-usage-12",
      type: "storage-unit-usage",
      wellRow: "C",
      wellColumn: 2,
      cellNumber: 12
    }
  },
  {
    id: "fe563156-a96a-4146-8548-0e606e52e579",
    type: "pcr-batch-item",
    materialSample: {
      id: "2c9904aa-dfdd-4eec-8de3-0291cfe216fc",
      type: "material-sample"
    },
    createdBy: "dina-admin",
    createdOn: "2023-04-20T12:51:39.770718Z",
    group: "aafc",
    result: "Multiple Bands",
    storageUnitUsage: {
      id: "storage-unit-usage-13",
      type: "storage-unit-usage",
      wellRow: "C",
      wellColumn: 3,
      cellNumber: 13
    }
  },
  {
    id: "d39a3180-9712-4aa2-966a-fd17092a00bc",
    type: "pcr-batch-item",
    materialSample: {
      id: "11861055-795f-46a1-b9d7-e1fe78075ba7",
      type: "material-sample"
    },
    createdBy: "dina-admin",
    createdOn: "2023-04-20T12:51:39.770718Z",
    group: "aafc",
    result: "Multiple Bands",
    storageUnitUsage: {
      id: "storage-unit-usage-14",
      type: "storage-unit-usage",
      wellRow: "C",
      wellColumn: 4,
      cellNumber: 14
    }
  },
  {
    id: "9feb1c1d-2dbd-457c-9dd6-c971f290f891",
    type: "pcr-batch-item",
    materialSample: {
      id: "faeaa8cf-cb9b-431b-b6a3-6fc56acd5879",
      type: "material-sample"
    },
    createdBy: "dina-admin",
    createdOn: "2023-04-20T12:51:39.770718Z",
    group: "aafc",
    result: "Multiple Bands",
    storageUnitUsage: {
      id: "storage-unit-usage-15",
      type: "storage-unit-usage",
      wellRow: "C",
      wellColumn: 5,
      cellNumber: 15
    }
  },
  {
    id: "354777cd-1454-4d54-bef0-06cc5ef69d6c",
    type: "pcr-batch-item",
    materialSample: {
      id: "76502039-8e9a-478d-a3cb-ec4c4fc12ada",
      type: "material-sample"
    },
    createdBy: "dina-admin",
    createdOn: "2023-04-20T12:51:39.770718Z",
    group: "aafc",
    result: "Contaminated",
    storageUnitUsage: {
      id: "storage-unit-usage-16",
      type: "storage-unit-usage",
      wellRow: "D",
      wellColumn: 1,
      cellNumber: 16
    }
  },
  {
    id: "3c30eb8c-7957-41ce-ab63-ce12d72987a4",
    type: "pcr-batch-item",
    materialSample: {
      id: "86165f8f-a770-4869-86f1-dc25a42541be",
      type: "material-sample"
    },
    createdBy: "dina-admin",
    createdOn: "2023-04-20T12:51:39.770718Z",
    group: "aafc",
    result: "Contaminated",
    storageUnitUsage: {
      id: "storage-unit-usage-17",
      type: "storage-unit-usage",
      wellRow: "D",
      wellColumn: 2,
      cellNumber: 17
    }
  },
  {
    id: "59d9c186-ae28-4acd-abc9-bb908ac7afc9",
    type: "pcr-batch-item",
    materialSample: {
      id: "7aebbe3c-9a3e-4cef-b5a2-f32b229c9787",
      type: "material-sample"
    },
    createdBy: "dina-admin",
    createdOn: "2023-04-20T12:51:39.770718Z",
    group: "aafc",
    result: "Contaminated",
    storageUnitUsage: {
      id: "storage-unit-usage-18",
      type: "storage-unit-usage",
      wellRow: "D",
      wellColumn: 3,
      cellNumber: 18
    }
  },
  {
    id: "449e2f3f-6088-4003-be24-0471c605faab",
    type: "pcr-batch-item",
    materialSample: {
      id: "e1a30ee1-80be-4cbc-a699-80196a6dd4eb",
      type: "material-sample"
    },
    createdBy: "dina-admin",
    createdOn: "2023-04-20T12:51:39.770718Z",
    group: "aafc",
    result: "Contaminated",
    storageUnitUsage: {
      id: "storage-unit-usage-19",
      type: "storage-unit-usage",
      wellRow: "D",
      wellColumn: 4,
      cellNumber: 19
    }
  },
  {
    id: "cb94ebd1-9a4b-4c86-ba0d-483ff88d1268",
    type: "pcr-batch-item",
    materialSample: {
      id: "97f6c8d2-87b4-49cb-ad79-e67b55f11d73",
      type: "material-sample"
    },
    createdBy: "dina-admin",
    createdOn: "2023-04-20T12:51:39.770718Z",
    group: "aafc",
    result: "Contaminated",
    storageUnitUsage: {
      id: "storage-unit-usage-20",
      type: "storage-unit-usage",
      wellRow: "D",
      wellColumn: 5,
      cellNumber: 20
    }
  },
  {
    id: "9a84a5fa-3f53-4fa6-93e2-4beebbf49474",
    type: "pcr-batch-item",
    materialSample: {
      id: "761e3f18-5572-40ca-942a-ca85ab650f7c",
      type: "material-sample"
    },
    createdBy: "dina-admin",
    createdOn: "2023-04-20T12:51:39.770718Z",
    group: "aafc",
    result: "Smear",
    storageUnitUsage: {
      id: "storage-unit-usage-21",
      type: "storage-unit-usage",
      wellRow: "E",
      wellColumn: 1,
      cellNumber: 21
    }
  },
  {
    id: "c02befb4-2b08-4450-b5b9-cf5efaffadd2",
    type: "pcr-batch-item",
    materialSample: {
      id: "99d8aa0c-418e-4fe9-9aca-4149d1ea2541",
      type: "material-sample"
    },
    createdBy: "dina-admin",
    createdOn: "2023-04-20T12:51:39.770718Z",
    group: "aafc",
    result: "Smear",
    storageUnitUsage: {
      id: "storage-unit-usage-22",
      type: "storage-unit-usage",
      wellRow: "E",
      wellColumn: 2,
      cellNumber: 22
    }
  },
  {
    id: "53393f5b-6ab7-4774-8ecd-3db660f443ac",
    type: "pcr-batch-item",
    materialSample: {
      id: "73ac47d6-3c5b-43da-a7b1-099e8e4a8ea5",
      type: "material-sample"
    },
    createdBy: "dina-admin",
    createdOn: "2023-04-20T12:51:39.770718Z",
    group: "aafc",
    result: "Smear",
    storageUnitUsage: {
      id: "storage-unit-usage-23",
      type: "storage-unit-usage",
      wellRow: "E",
      wellColumn: 3,
      cellNumber: 23
    }
  },
  {
    id: "d3f5ef2f-4c0d-44ae-a57a-ff365c492cb5",
    type: "pcr-batch-item",
    materialSample: {
      id: "461aac66-2a6a-481c-a70b-d0d3cd313c9e",
      type: "material-sample"
    },
    createdBy: "dina-admin",
    createdOn: "2023-04-20T12:51:39.770718Z",
    group: "aafc",
    result: "Smear",
    storageUnitUsage: {
      id: "storage-unit-usage-24",
      type: "storage-unit-usage",
      wellRow: "E",
      wellColumn: 4,
      cellNumber: 24
    }
  },
  {
    id: "ed282ffc-7329-4624-9de4-d778edd04b76",
    type: "pcr-batch-item",
    materialSample: {
      id: "e54f4cdf-0e41-41ab-974f-61117bf169f7",
      type: "material-sample"
    },
    createdBy: "dina-admin",
    createdOn: "2023-04-20T12:51:39.770718Z",
    group: "aafc",
    result: "Smear",
    storageUnitUsage: {
      id: "storage-unit-usage-25",
      type: "storage-unit-usage",
      wellRow: "E",
      wellColumn: 5,
      cellNumber: 25
    }
  },
  {
    id: "968e4cf9-3504-4d11-851e-e70f55448c45",
    type: "pcr-batch-item",
    materialSample: {
      id: "5024fbfb-d0c1-4799-aa45-01697b4bec36",
      type: "material-sample"
    },
    createdBy: "dina-admin",
    createdOn: "2023-04-20T12:51:39.770718Z",
    group: "aafc",
    result: "Custom Result",
    storageUnitUsage: {
      id: "storage-unit-usage-26",
      type: "storage-unit-usage",
      wellRow: "F",
      wellColumn: 1,
      cellNumber: 26
    }
  },
  {
    id: "976560dd-efe9-4275-8c03-6d11606107f7",
    type: "pcr-batch-item",
    materialSample: {
      id: "35bd1f71-e5d2-4790-ab33-a3a79ba1e76a",
      type: "material-sample"
    },
    createdBy: "dina-admin",
    createdOn: "2023-04-20T12:51:39.770718Z",
    group: "aafc",
    result: "",
    storageUnitUsage: {
      id: "storage-unit-usage-27",
      type: "storage-unit-usage",
      wellRow: "F",
      wellColumn: 2,
      cellNumber: 27
    }
  },
  {
    id: "4d06a453-e650-46dc-9b05-d2f6a83634c6",
    type: "pcr-batch-item",
    materialSample: {
      id: "576a20cc-fc1a-4436-b730-8349ef450b6a",
      type: "material-sample"
    },
    createdBy: "dina-admin",
    createdOn: "2023-04-20T12:51:39.770718Z",
    group: "aafc",
    result: "",
    storageUnitUsage: {
      id: "storage-unit-usage-28",
      type: "storage-unit-usage",
      wellRow: "F",
      wellColumn: 3,
      cellNumber: 28
    }
  },
  {
    id: "f3d5f888-5a74-45bf-9663-495809da7346",
    type: "pcr-batch-item",
    materialSample: {
      id: "da52dcc1-201d-421a-82d6-77558b5d144c",
      type: "material-sample"
    },
    createdBy: "dina-admin",
    createdOn: "2023-04-20T12:51:39.770718Z",
    group: "aafc",
    result: "",
    storageUnitUsage: {
      id: "storage-unit-usage-29",
      type: "storage-unit-usage",
      wellRow: "F",
      wellColumn: 4,
      cellNumber: 29
    }
  },
  {
    id: "763cce36-9ac0-461c-a833-eb94cc77bd54",
    type: "pcr-batch-item",
    materialSample: {
      id: "91487630-a945-41bd-a678-b921ba1d2013",
      type: "material-sample"
    },
    createdBy: "dina-admin",
    createdOn: "2023-04-20T12:51:39.770718Z",
    group: "aafc",
    result: "",
    storageUnitUsage: {
      id: "storage-unit-usage-30",
      type: "storage-unit-usage",
      wellRow: "F",
      wellColumn: 5,
      cellNumber: 30
    }
  }
];

export const MATERIAL_SAMPLES: MaterialSampleSummary[] = [
  {
    id: "53c8dd5c-a287-41d7-8a30-e1ea26580e7e",
    type: "material-sample-summary",
    materialSampleName: "1",
    effectiveDeterminations: [
      {
        isPrimary: true,
        verbatimScientificName: "scientificName"
      }
    ]
  },
  {
    id: "b7e464a8-7715-4742-b0bb-6b826bd054fb",
    type: "material-sample-summary",
    effectiveDeterminations: [
      {
        isPrimary: true,
        verbatimScientificName: "scientificName"
      }
    ],
    materialSampleName: "2"
  },
  {
    id: "c40ba07d-57f3-4461-92de-2735b3533e8a",
    type: "material-sample-summary",
    effectiveDeterminations: [
      {
        isPrimary: true,
        verbatimScientificName: "scientificName"
      }
    ],
    materialSampleName: "3"
  },
  {
    id: "99e732dd-e755-43ef-8158-5a8dcf9c4239",
    type: "material-sample-summary",
    effectiveDeterminations: [
      {
        isPrimary: true,
        verbatimScientificName: "scientificName"
      }
    ],
    materialSampleName: "4"
  },
  {
    id: "863431e7-7465-4347-9854-8c1729b46d4c",
    type: "material-sample-summary",
    effectiveDeterminations: [
      {
        isPrimary: true,
        verbatimScientificName: "scientificName"
      }
    ],
    materialSampleName: "5"
  },
  {
    id: "102e35ee-f5bc-4403-bf09-3d8fd8d33ddc",
    type: "material-sample-summary",
    effectiveDeterminations: [
      {
        isPrimary: true,
        verbatimScientificName: "scientificName"
      }
    ],
    materialSampleName: "6"
  },
  {
    id: "286375f6-32cc-4d8b-8303-75c9830f761d",
    type: "material-sample-summary",
    effectiveDeterminations: [
      {
        isPrimary: true,
        verbatimScientificName: "scientificName"
      }
    ],
    materialSampleName: "7"
  },
  {
    id: "c54932e4-1d6a-42b2-8d6d-4b608be7e3dd",
    type: "material-sample-summary",
    effectiveDeterminations: [
      {
        isPrimary: true,
        verbatimScientificName: "scientificName"
      }
    ],
    materialSampleName: "8"
  },
  {
    id: "31380b5c-69a7-40eb-8d16-8006961d1bed",
    type: "material-sample-summary",
    effectiveDeterminations: [
      {
        isPrimary: true,
        verbatimScientificName: "scientificName"
      }
    ],
    materialSampleName: "9"
  },
  {
    id: "8a5ae1d0-da78-4f36-b252-c126b79dc465",
    type: "material-sample-summary",
    effectiveDeterminations: [
      {
        isPrimary: true,
        verbatimScientificName: "scientificName"
      }
    ],
    materialSampleName: "10"
  },
  {
    id: "32f64502-2856-4bc2-b32a-8977d7a0cc93",
    type: "material-sample-summary",
    effectiveDeterminations: [
      {
        isPrimary: true,
        verbatimScientificName: "scientificName"
      }
    ],
    materialSampleName: "11"
  },
  {
    id: "ac6c2712-bfb2-4e93-a4ce-0270bad5d439",
    type: "material-sample-summary",
    effectiveDeterminations: [
      {
        isPrimary: true,
        verbatimScientificName: "scientificName"
      }
    ],
    materialSampleName: "12"
  },
  {
    id: "2c9904aa-dfdd-4eec-8de3-0291cfe216fc",
    type: "material-sample-summary",
    effectiveDeterminations: [
      {
        isPrimary: true,
        verbatimScientificName: "scientificName"
      }
    ],
    materialSampleName: "13"
  },
  {
    id: "11861055-795f-46a1-b9d7-e1fe78075ba7",
    type: "material-sample-summary",
    effectiveDeterminations: [
      {
        isPrimary: true,
        verbatimScientificName: "scientificName"
      }
    ],
    materialSampleName: "14"
  },
  {
    id: "faeaa8cf-cb9b-431b-b6a3-6fc56acd5879",
    type: "material-sample-summary",
    effectiveDeterminations: [
      {
        isPrimary: true,
        verbatimScientificName: "scientificName"
      }
    ],
    materialSampleName: "15"
  },
  {
    id: "76502039-8e9a-478d-a3cb-ec4c4fc12ada",
    type: "material-sample-summary",
    effectiveDeterminations: [
      {
        isPrimary: true,
        verbatimScientificName: "scientificName"
      }
    ],

    materialSampleName: "16"
  },
  {
    id: "86165f8f-a770-4869-86f1-dc25a42541be",
    type: "material-sample-summary",
    effectiveDeterminations: [
      {
        isPrimary: true,
        verbatimScientificName: "scientificName"
      }
    ],

    materialSampleName: "17"
  },
  {
    id: "7aebbe3c-9a3e-4cef-b5a2-f32b229c9787",
    type: "material-sample-summary",
    effectiveDeterminations: [
      {
        isPrimary: true,
        verbatimScientificName: "scientificName"
      }
    ],

    materialSampleName: "18"
  },
  {
    id: "e1a30ee1-80be-4cbc-a699-80196a6dd4eb",
    type: "material-sample-summary",

    effectiveDeterminations: [
      {
        isPrimary: true,
        verbatimScientificName: "scientificName"
      }
    ],

    materialSampleName: "19"
  },
  {
    id: "97f6c8d2-87b4-49cb-ad79-e67b55f11d73",
    type: "material-sample-summary",

    effectiveDeterminations: [
      {
        isPrimary: true,
        verbatimScientificName: "scientificName"
      }
    ],

    materialSampleName: "20"
  },
  {
    id: "761e3f18-5572-40ca-942a-ca85ab650f7c",
    type: "material-sample-summary",

    effectiveDeterminations: [
      {
        isPrimary: true,
        verbatimScientificName: "scientificName"
      }
    ],

    materialSampleName: "21"
  },
  {
    id: "99d8aa0c-418e-4fe9-9aca-4149d1ea2541",
    type: "material-sample-summary",

    effectiveDeterminations: [
      {
        isPrimary: true,
        verbatimScientificName: "scientificName"
      }
    ],

    materialSampleName: "22"
  },
  {
    id: "73ac47d6-3c5b-43da-a7b1-099e8e4a8ea5",
    type: "material-sample-summary",

    effectiveDeterminations: [
      {
        isPrimary: true,
        verbatimScientificName: "scientificName"
      }
    ],

    materialSampleName: "23"
  },
  {
    id: "461aac66-2a6a-481c-a70b-d0d3cd313c9e",
    type: "material-sample-summary",
    effectiveDeterminations: [
      {
        isPrimary: true,
        verbatimScientificName: "scientificName"
      }
    ],

    materialSampleName: "24"
  },
  {
    id: "e54f4cdf-0e41-41ab-974f-61117bf169f7",
    type: "material-sample-summary",

    effectiveDeterminations: [
      {
        isPrimary: true,
        verbatimScientificName: "scientificName"
      }
    ],

    materialSampleName: "25"
  },
  {
    id: "5024fbfb-d0c1-4799-aa45-01697b4bec36",
    type: "material-sample-summary",

    effectiveDeterminations: [
      {
        isPrimary: true,
        verbatimScientificName: "scientificName"
      }
    ],

    materialSampleName: "26"
  },
  {
    id: "35bd1f71-e5d2-4790-ab33-a3a79ba1e76a",
    type: "material-sample-summary",

    effectiveDeterminations: [
      {
        isPrimary: true,
        verbatimScientificName: "scientificName"
      }
    ],

    materialSampleName: "27"
  },
  {
    id: "576a20cc-fc1a-4436-b730-8349ef450b6a",
    type: "material-sample-summary",
    effectiveDeterminations: [
      {
        isPrimary: true,
        verbatimScientificName: "scientificName"
      }
    ],

    materialSampleName: "28"
  },
  {
    id: "da52dcc1-201d-421a-82d6-77558b5d144c",
    type: "material-sample-summary",

    effectiveDeterminations: [
      {
        isPrimary: true,
        verbatimScientificName: "scientificName"
      }
    ],

    materialSampleName: "29"
  },
  {
    id: "91487630-a945-41bd-a678-b921ba1d2013",
    type: "material-sample-summary",

    effectiveDeterminations: [
      {
        isPrimary: true,
        verbatimScientificName: "scientificName"
      }
    ],

    materialSampleName: "30"
  }
];
