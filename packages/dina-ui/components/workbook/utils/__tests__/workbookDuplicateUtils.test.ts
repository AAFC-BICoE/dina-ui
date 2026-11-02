import { RelationshipMapping } from "../../types/Workbook";
import {
  checkServerDuplicatePrimaryIds,
  getDuplicateRowNumbers,
  getPrimaryIdEntries
} from "../workbookDuplicateUtils";

const COLLECTION_A_UUID = "11111111-1111-1111-1111-111111111111";
const COLLECTION_B_UUID = "22222222-2222-2222-2222-222222222222";

const relationshipMapping: RelationshipMapping = {
  "Collection Name": {
    "Collection A": { id: COLLECTION_A_UUID, type: "collection" },
    "Collection B": { id: COLLECTION_B_UUID, type: "collection" },
    "Coll_ v1_0": { id: COLLECTION_B_UUID, type: "collection" }
  }
};

describe("workbookDuplicateUtils", () => {
  describe("getPrimaryIdEntries", () => {
    it("flags rows with the same primary id and collection as local duplicates", () => {
      const entries = getPrimaryIdEntries(
        [
          {
            rowNumber: 1,
            materialSampleName: "S-1",
            "collection.name": "Collection A"
          },
          {
            rowNumber: 2,
            materialSampleName: "S-2",
            "collection.name": "Collection A"
          },
          {
            rowNumber: 3,
            materialSampleName: "S-1",
            "collection.name": "Collection A"
          }
        ],
        "Collection Name",
        relationshipMapping
      );

      expect(entries).toEqual([
        {
          materialSampleName: "S-1",
          collectionName: "Collection A",
          collectionUuid: COLLECTION_A_UUID,
          rowNumbers: [1, 3],
          localDuplicate: true,
          serverDuplicate: false
        },
        {
          materialSampleName: "S-2",
          collectionName: "Collection A",
          collectionUuid: COLLECTION_A_UUID,
          rowNumbers: [2],
          localDuplicate: false,
          serverDuplicate: false
        }
      ]);
    });

    it("does not flag the same primary id in different collections", () => {
      const entries = getPrimaryIdEntries(
        [
          {
            rowNumber: 1,
            materialSampleName: "S-1",
            "collection.name": "Collection A"
          },
          {
            rowNumber: 2,
            materialSampleName: "S-1",
            "collection.name": "Collection B"
          }
        ],
        "Collection Name",
        relationshipMapping
      );

      expect(entries).toHaveLength(2);
      expect(entries.every((entry) => !entry.localDuplicate)).toBe(true);
    });

    it("resolves the collection uuid for headers with spaces and values with dots", () => {
      const entries = getPrimaryIdEntries(
        [
          {
            rowNumber: 1,
            materialSampleName: "S-1",
            "collection.name": "Coll. v1.0"
          }
        ],
        "Collection Name",
        relationshipMapping
      );

      expect(entries[0].collectionUuid).toEqual(COLLECTION_B_UUID);
    });

    it("still detects local duplicates when the collection is not in the relationship mapping", () => {
      const entries = getPrimaryIdEntries(
        [
          {
            rowNumber: 1,
            materialSampleName: "S-1",
            "collection.name": "Unmapped"
          },
          {
            rowNumber: 2,
            materialSampleName: "S-1",
            "collection.name": "Unmapped"
          }
        ],
        "Collection Name",
        relationshipMapping
      );

      expect(entries).toHaveLength(1);
      expect(entries[0].localDuplicate).toBe(true);
      expect(entries[0].collectionUuid).toBeUndefined();
    });

    it("uses only the primary id when no collection column is mapped", () => {
      const entries = getPrimaryIdEntries(
        [
          { rowNumber: 1, materialSampleName: "S-1" },
          { rowNumber: 2, materialSampleName: "S-2" },
          { rowNumber: 3, materialSampleName: "S-1" }
        ],
        undefined,
        relationshipMapping
      );

      expect(entries).toEqual([
        {
          materialSampleName: "S-1",
          collectionName: undefined,
          collectionUuid: undefined,
          rowNumbers: [1, 3],
          localDuplicate: true,
          serverDuplicate: false
        },
        {
          materialSampleName: "S-2",
          collectionName: undefined,
          collectionUuid: undefined,
          rowNumbers: [2],
          localDuplicate: false,
          serverDuplicate: false
        }
      ]);
    });

    it("ignores rows without a primary id", () => {
      const entries = getPrimaryIdEntries(
        [
          { rowNumber: 1, materialSampleName: "" },
          { rowNumber: 2, materialSampleName: "   " },
          { rowNumber: 3 }
        ],
        undefined,
        relationshipMapping
      );

      expect(entries).toEqual([]);
    });
  });

  describe("checkServerDuplicatePrimaryIds", () => {
    it("flags entries that already exist in the same collection with one request", async () => {
      const mockGet = jest.fn(async (_path: string, _params: any) => ({
        data: [{ id: "existing", materialSampleName: "S-1" }]
      }));

      const entries = getPrimaryIdEntries(
        [
          {
            rowNumber: 1,
            materialSampleName: "S-1",
            "collection.name": "Collection A"
          },
          {
            rowNumber: 2,
            materialSampleName: "S-2",
            "collection.name": "Collection A"
          }
        ],
        "Collection Name",
        relationshipMapping
      );

      const result = await checkServerDuplicatePrimaryIds(
        { get: mockGet } as any,
        entries
      );

      expect(result.map((entry) => entry.serverDuplicate)).toEqual([
        true,
        false
      ]);
      expect(mockGet).toHaveBeenCalledTimes(1);
      const [path, params] = mockGet.mock.calls[0];
      expect(path).toEqual("collection-api/material-sample");
      expect(JSON.stringify(params.filter)).toContain(COLLECTION_A_UUID);
      expect(JSON.stringify(params.filter)).not.toContain("group");
    });

    it("looks up names containing a comma individually with EQ", async () => {
      const mockGet = jest.fn(async (_path: string, params: any) => {
        const filter = JSON.stringify(params.filter);
        return {
          data: filter.includes("S-1, b")
            ? [{ id: "existing", materialSampleName: "S-1, b" }]
            : []
        };
      });

      const entries = getPrimaryIdEntries(
        [
          {
            rowNumber: 1,
            materialSampleName: "S-1, b",
            "collection.name": "Collection A"
          },
          {
            rowNumber: 2,
            materialSampleName: "S-2",
            "collection.name": "Collection A"
          },
          {
            rowNumber: 3,
            materialSampleName: "S-3",
            "collection.name": "Collection A"
          }
        ],
        "Collection Name",
        relationshipMapping
      );

      const result = await checkServerDuplicatePrimaryIds(
        { get: mockGet } as any,
        entries
      );

      expect(result.map((entry) => entry.serverDuplicate)).toEqual([
        true,
        false,
        false
      ]);
      // One IN request for S-2 and S-3, one EQ request for the comma name.
      expect(mockGet).toHaveBeenCalledTimes(2);
      const filters = mockGet.mock.calls.map(([, params]) =>
        JSON.stringify(params.filter)
      );
      expect(filters.filter((f) => f.includes("S-1, b"))).toHaveLength(1);
      expect(filters.find((f) => f.includes("S-2"))).toContain("S-3");
    });

    function entry(
      materialSampleName: string,
      collectionUuid = COLLECTION_A_UUID
    ) {
      return {
        materialSampleName,
        collectionUuid,
        rowNumbers: [1],
        localDuplicate: false,
        serverDuplicate: false
      };
    }

    function requestedNames(params: any): string[] {
      const { IN, EQ } = params.filter.materialSampleName;
      return IN ? String(IN).split(",") : [EQ];
    }

    /** Every requested name exists, unless the request asks for failingName. */
    function mockServer(failingName?: string) {
      return jest.fn(async (_path: string, params: any) => {
        const names = requestedNames(params);
        if (failingName && names.includes(failingName)) {
          throw new Error("Request failed");
        }
        return {
          data: names.map((materialSampleName) => ({ materialSampleName }))
        };
      });
    }

    const names = Array.from({ length: 150 }, (_, i) => `S-${i}`);

    it("splits more than 100 names into chunks of 100", async () => {
      const mockGet = mockServer();

      const result = await checkServerDuplicatePrimaryIds(
        { get: mockGet } as any,
        names.map((name) => entry(name))
      );

      expect(result.every((e) => e.serverDuplicate)).toBe(true);
      expect(
        mockGet.mock.calls.map(([, params]) => requestedNames(params).length)
      ).toEqual([100, 50]);
    });

    it("makes one request per collection", async () => {
      const mockGet = mockServer();

      await checkServerDuplicatePrimaryIds({ get: mockGet } as any, [
        entry("S-1", COLLECTION_A_UUID),
        entry("S-2", COLLECTION_A_UUID),
        entry("S-1", COLLECTION_B_UUID)
      ]);

      expect(
        mockGet.mock.calls.map(([, params]) => [
          params.filter["collection.uuid"].EQ,
          requestedNames(params)
        ])
      ).toEqual([
        [COLLECTION_A_UUID, ["S-1", "S-2"]],
        [COLLECTION_B_UUID, ["S-1"]]
      ]);
    });

    it.each([
      // The first chunk (S-0 to S-99) fails.
      ["a chunk", "S-0", names, names.slice(100)],
      ["a comma name", "S-0, b", ["S-0, b", "S-1"], ["S-1"]]
    ])(
      "leaves only the names of %s that failed unflagged",
      async (_description, failingName, entryNames, expectedFlagged) => {
        jest.spyOn(console, "error").mockImplementation(() => undefined);

        const result = await checkServerDuplicatePrimaryIds(
          { get: mockServer(failingName) } as any,
          entryNames.map((name) => entry(name))
        );

        expect(
          result
            .filter((e) => e.serverDuplicate)
            .map((e) => e.materialSampleName)
        ).toEqual(expectedFlagged);
      }
    );

    it("does not query the server for entries without a collection", async () => {
      const mockGet = jest.fn();

      const entries = getPrimaryIdEntries(
        [
          { rowNumber: 1, materialSampleName: "S-1" },
          {
            rowNumber: 2,
            materialSampleName: "S-2",
            "collection.name": "Unmapped"
          }
        ],
        undefined,
        relationshipMapping
      );

      const result = await checkServerDuplicatePrimaryIds(
        { get: mockGet } as any,
        entries
      );

      expect(mockGet).not.toHaveBeenCalled();
      expect(result.every((entry) => !entry.serverDuplicate)).toBe(true);
    });
  });

  describe("getDuplicateRowNumbers", () => {
    it("returns every row number involved in a local or server duplicate", () => {
      const rowNumbers = getDuplicateRowNumbers([
        {
          materialSampleName: "S-1",
          rowNumbers: [1, 3],
          localDuplicate: true,
          serverDuplicate: false
        },
        {
          materialSampleName: "S-2",
          rowNumbers: [2],
          localDuplicate: false,
          serverDuplicate: true
        },
        {
          materialSampleName: "S-3",
          rowNumbers: [4],
          localDuplicate: false,
          serverDuplicate: false
        }
      ]);

      expect(rowNumbers.sort()).toEqual([1, 2, 3]);
    });
  });
});
