import { importCsvMessages } from "../messages-csv-import";
import { utils as sheetUtils } from "xlsx";
import { CsvRow, MessageDictionary } from "../intl-config";

const MOCK_MESSAGES: MessageDictionary = {
  app1: {
    english: {
      file: "file1",
      messages: {
        hello: "hello",
        goodbye: "goodbye"
      }
    },
    french: {
      file: "file2",
      messages: {
        hello: "bonjour"
      }
    }
  },
  app2: {
    english: {
      file: "file3",
      messages: {
        yes: "YES",
        no: "NO"
      }
    },
    french: {
      file: "file4",
      messages: {}
    }
  }
};

const MOCK_MESSAGE_FILE = `
import { MOCK_UI_MESSAGES_BASE } from "./MOCK-ui-en";

export const MOCK_UI_MESSAGES: Partial<typeof MOCK_UI_MESSAGES_BASE> = {};
`;

describe("Csv intl messages export", () => {
  it("Imports the CSV messages", () => {
    const csvRows: CsvRow[] = [
      { app: "app1", key: "hello", french: "bonjour" },
      { app: "app2", key: "YES", english: "YES", french: "OUI" },
      { app: "app2", key: "NO", english: "NO" }
    ];

    const testCsvSheet = sheetUtils.json_to_sheet(csvRows);

    const mockReadFile = jest.fn(() => MOCK_MESSAGE_FILE);
    const mockWriteFile = jest.fn();

    importCsvMessages({
      csvSheet: testCsvSheet,
      messageGroups: MOCK_MESSAGES,
      readFile: mockReadFile,
      writeFile: mockWriteFile
    });

    // The source code should be written to the correct files:
    expect(mockWriteFile.mock.calls).toEqual([
      [
        "file1",
        "\n" +
          'import { MOCK_UI_MESSAGES_BASE } from "./MOCK-ui-en";\n' +
          "\n" +
          "export const MOCK_UI_MESSAGES: Partial<typeof MOCK_UI_MESSAGES_BASE> = {\n" +
          '  "goodbye": "goodbye",\n' +
          '  "hello": "hello"\n' +
          "};\n"
      ],
      [
        "file2",
        "\n" +
          'import { MOCK_UI_MESSAGES_BASE } from "./MOCK-ui-en";\n' +
          "\n" +
          "export const MOCK_UI_MESSAGES: Partial<typeof MOCK_UI_MESSAGES_BASE> = {\n" +
          '  "hello": "bonjour"\n' +
          "};\n"
      ],
      [
        "file3",
        "\n" +
          'import { MOCK_UI_MESSAGES_BASE } from "./MOCK-ui-en";\n' +
          "\n" +
          "export const MOCK_UI_MESSAGES: Partial<typeof MOCK_UI_MESSAGES_BASE> = {\n" +
          '  "NO": "NO",\n' +
          '  "YES": "YES",\n' +
          '  "no": "NO",\n' +
          '  "yes": "YES"\n' +
          "};\n"
      ],
      [
        "file4",
        "\n" +
          'import { MOCK_UI_MESSAGES_BASE } from "./MOCK-ui-en";\n' +
          "\n" +
          "export const MOCK_UI_MESSAGES: Partial<typeof MOCK_UI_MESSAGES_BASE> = {\n" +
          '  "YES": "OUI"\n' +
          "};\n"
      ]
    ]);
  });
});
