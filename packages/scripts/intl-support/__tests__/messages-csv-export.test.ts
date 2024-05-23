import { messagesToCsv } from "../messages-csv-export";

describe("Csv intl messages export", () => {
  it("Exports the messages as CSV", () => {
    const csv = messagesToCsv({
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
    });

    expect(csv).toEqual(
      [
        "app,key,english,french",
        "app1,hello,hello,bonjour",
        "app1,goodbye,goodbye,",
        "app2,yes,YES,",
        "app2,no,NO,"
      ].join("\n")
    );
  });
});
