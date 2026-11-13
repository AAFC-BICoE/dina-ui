import { query } from "kitsu-core";
import {
  SimpleSearchFilter,
  SimpleSearchFilterBuilder,
  filterKeywordPositions,
  formatInList,
  isPlainFilterValue
} from "../simpleSearchFilterBuilder";
import {
  parseInList,
  serializeKitsuParams,
  simpleSearchFilterToQueryString
} from "../simpleSearchFilterQueryString";

/** The query string as the back-end parses it: it decodes the whole string first. */
const decoded = (filter: SimpleSearchFilter) =>
  decodeURIComponent(simpleSearchFilterToQueryString(filter));

describe("isPlainFilterValue", () => {
  it.each([
    ["T77306P-sp-a b", true],
    ["aéb µ", true],
    ["2026-10-13T07:00:00.000Z", true],
    ["50%_a/b:c.d-e", true],
    ["filter sort page include fields", true],
    ["in like INSITU a_INX", true],
    ["", false],
    ["IN SITU", false],
    ["a-IN-b", false],
    ["1IN", false],
    ["upper limit", false],
    // Legacy lexer rules match keywords adjacent to "_", ".", or digits.
    ["a_IN", false],
    ["x.EQ.y", false],
    ["john.offset", false],
    ["limit_5", false],
    ["a'b", false],
    ["a,b", false],
    ["a\tb", false],
    ["a😀b", false]
  ])("%j is plain: %s", (value, plain) => {
    expect(isPlainFilterValue(value)).toEqual(plain);
  });

  // The characters and keywords below are taken from the back-end grammar
  // (dina-filter SimpleSearchFilter.g4), not from the code under test.
  it.each([..."'#@$~?<>^{}\\`+°–,;()*=![]|&\"\t\r\n\u00a0\u0301", "😀"])(
    "%j inside a value is not plain",
    (character) => {
      expect(isPlainFilterValue(`x${character}y`)).toBe(false);
    }
  );

  it.each([
    "EQ",
    "NEQ",
    "GT",
    "GOE",
    "LT",
    "LOE",
    "LIKE",
    "ILIKE",
    "IN",
    "limit",
    "offset",
    "fiql",
    "optfields"
  ])("the keyword %j inside a value is not plain", (keyword) => {
    expect(isPlainFilterValue(`a ${keyword} b`)).toBe(false);
    expect(isPlainFilterValue(`a_${keyword}`)).toBe(false);
  });

  it("finds the keywords the back-end grammar reads inside a value", () => {
    expect(filterKeywordPositions("a IN b, 1LIKE, x_EQ, upper limit")).toEqual([
      2, 9, 17, 27
    ]);
  });

  it("finds only the keywords dina-base-api 0.178+ reads without the legacy lexer", () => {
    // Without legacyLexer, "x_EQ", "IN2023", "x.IN" and "speed_limit" are treated as single tokens.
    expect(
      filterKeywordPositions("a IN b, x_EQ, IN2023, x.IN, speed_limit", {
        legacyLexer: false
      })
    ).toEqual([2]);
    expect(isPlainFilterValue("IV77306-tube_IN", { legacyLexer: false })).toBe(
      true
    );
    expect(isPlainFilterValue("IV77306-tube_IN")).toBe(false);
  });
});

describe("IN lists", () => {
  it("quotes only the values a list can't carry as they are", () => {
    expect(formatInList(["aafc", "cnc"])).toEqual("aafc,cnc");
    expect(formatInList(["New York, NY", "Ottawa"])).toEqual(
      '"New York, NY",Ottawa'
    );
    expect(formatInList(["a\\b", 'say "hi"', "IN"])).toEqual(
      '"a\\\\b","say _hi_","IN"'
    );
    // The back-end trims unquoted values.
    expect(formatInList([" a ", "b"])).toEqual('" a ",b');
    expect(formatInList([1, true, null, undefined, ""])).toEqual("1,true");
  });

  it("reads a list back the way the back-end does", () => {
    for (const values of [
      ["aafc", "cnc"],
      ["New York, NY", "Ottawa"],
      ["a\\b", "a;b", "O'Brien, Zoë"],
      [" a ", "b"]
    ]) {
      expect(parseInList(formatInList(values))).toEqual(values);
    }
    expect(parseInList(" a , b ,,")).toEqual(["a", "b"]);
  });
});

describe("simpleSearchFilterToQueryString", () => {
  it("returns an empty string for an empty filter", () => {
    expect(simpleSearchFilterToQueryString(undefined)).toEqual("");
    expect(simpleSearchFilterToQueryString({})).toEqual("");
  });

  it("serializes a group-less filter exactly like kitsu-core", () => {
    const filter = SimpleSearchFilterBuilder.create()
      .searchFilter("name", "test value")
      .where("group", "EQ", "aafc")
      .where("age", "GOE", 18)
      .whereIn("type", ["a", "b"])
      .build();

    expect(simpleSearchFilterToQueryString(filter)).toEqual(
      "filter%5Bname%5D%5BILIKE%5D=%25test%20value%25&filter%5Bgroup%5D%5BEQ%5D=aafc&filter%5Bage%5D%5BGOE%5D=18&filter%5Btype%5D%5BIN%5D=a%2Cb"
    );
    expect(simpleSearchFilterToQueryString(filter)).toEqual(query({ filter }));
  });

  it("serializes legacy operator-less values exactly like kitsu-core", () => {
    const filter = { name: "todo 2", flag: true, group: { EQ: "aafc" } };
    expect(simpleSearchFilterToQueryString(filter)).toEqual(query({ filter }));
  });

  it("encodes brackets, and quotes values containing them, so only groups have raw ones", () => {
    // The back-end decodes the whole query string before parsing it, so encoding alone protects nothing.
    expect(
      simpleSearchFilterToQueryString({
        $or: [{ a: { EQ: "x)" } }, { b: { EQ: "y" } }]
      })
    ).toEqual("(filter%5Ba%5D%5BIN%5D=%22x%29%22|filter%5Bb%5D%5BEQ%5D=y)");
    expect(simpleSearchFilterToQueryString({ "a(1)": { EQ: "(b)" } })).toEqual(
      "filter%5Ba%281%29%5D%5BIN%5D=%22%28b%29%22"
    );
  });

  it("serializes blank and null values like kitsu-core instead of dropping them", () => {
    // Dropping a blank value turns a query matching nothing into an unfiltered one.
    for (const filter of [
      { name: "" },
      { name: null },
      { name: "", group: { EQ: "aafc" } },
      { name: null, group: { EQ: "aafc" } }
    ]) {
      expect(simpleSearchFilterToQueryString(filter)).toEqual(
        query({ filter })
      );
    }
  });

  it("hands values it does not model back to kitsu-core", () => {
    // Arrays and deeper nesting retain their original shape.
    // The deeply nested one is a legacy kitsu filter requiring a cast.
    const filters: any[] = [
      { id: ["a", "b"] },
      { uuid: { IN: ["a", "b"] } },
      { a: { b: { c: 1 } } },
      { id: ["a"], group: { EQ: "aafc" } }
    ];
    for (const filter of filters) {
      expect(simpleSearchFilterToQueryString(filter)).toEqual(
        query({ filter })
      );
    }
  });

  it("emits no condition for an empty IN list, rather than matching only blanks", () => {
    expect(simpleSearchFilterToQueryString({ group: { IN: "" } })).toEqual("");
    expect(simpleSearchFilterToQueryString({ group: { IN: [] } })).toEqual("");
    expect(
      simpleSearchFilterToQueryString({ group: { IN: [] }, name: { EQ: "x" } })
    ).toEqual("filter%5Bname%5D%5BEQ%5D=x");
  });

  it('sends an IN list of only blank values as "", which matches blank values only, instead of dropping it', () => {
    // Dropping it would match every record.
    expect(
      serializeKitsuParams({
        filter: { uuid: { IN: "," } },
        page: { limit: 1 }
      })
    ).toEqual("filter%5Buuid%5D%5BIN%5D=%22%22&page%5Blimit%5D=1");
    expect(decoded({ uuid: { IN: [null, null] } })).toEqual(
      'filter[uuid][IN]=""&filter[uuid][IN]=""'
    );
    // A blank or null member of an IN array keeps its param, which the back-end ANDs.
    expect(decoded({ uuid: { IN: ["a", null] } })).toEqual(
      'filter[uuid][IN]=a&filter[uuid][IN]=""'
    );
  });

  it("sends an IN list as one comma-separated value, quoting a value containing a comma", () => {
    // The back-end removes the quotes of IN values, so "New York, NY" stays one value.
    const filter = SimpleSearchFilterBuilder.create()
      .whereIn("city", ["New York, NY", "Ottawa"])
      .build();
    expect(simpleSearchFilterToQueryString(filter)).toEqual(
      "filter%5Bcity%5D%5BIN%5D=%22New%20York%2C%20NY%22%2COttawa"
    );
  });

  it("serializes an OR group with the grouped syntax", () => {
    const filter = SimpleSearchFilterBuilder.create()
      .or((b) => b.where("a", "EQ", 1).where("b", "EQ", 2))
      .where("c", "EQ", 3)
      .build();
    expect(simpleSearchFilterToQueryString(filter)).toEqual(
      "(filter%5Ba%5D%5BEQ%5D=1|filter%5Bb%5D%5BEQ%5D=2)&filter%5Bc%5D%5BEQ%5D=3"
    );
  });

  it("serializes nested groups", () => {
    const filter = SimpleSearchFilterBuilder.create()
      .or((b) =>
        b
          .where("a", "EQ", 1)
          .and((b2) => b2.where("b", "EQ", 2).where("c", "EQ", 3))
      )
      .or((b) => b.where("d", "EQ", 4).where("e", "EQ", 5))
      .build();
    expect(simpleSearchFilterToQueryString(filter)).toEqual(
      "(filter%5Ba%5D%5BEQ%5D=1|(filter%5Bb%5D%5BEQ%5D=2&filter%5Bc%5D%5BEQ%5D=3))&(filter%5Bd%5D%5BEQ%5D=4|filter%5Be%5D%5BEQ%5D=5)"
    );
  });

  it("does not wrap a single-member group in parentheses", () => {
    expect(
      simpleSearchFilterToQueryString({ $or: [{ a: { EQ: 1 } }] })
    ).toEqual("filter%5Ba%5D%5BEQ%5D=1");
  });

  it("passes NOT_ILIKE and null through, which the back-end answers with 500 and 0 rows", () => {
    expect(
      simpleSearchFilterToQueryString({ name: { NOT_ILIKE: "%a%" } })
    ).toEqual("filter%5Bname%5D%5BNOT_ILIKE%5D=%25a%25");
    expect(simpleSearchFilterToQueryString({ name: { EQ: null } })).toEqual(
      "filter%5Bname%5D%5BEQ%5D=null"
    );
  });
});

describe("serializeKitsuParams", () => {
  const params = {
    fields: { person: "name,email" },
    filter: { name: { ILIKE: "%a%" }, group: { EQ: "aafc" } },
    include: "organizations",
    page: { limit: 25, offset: 0 },
    sort: "-createdOn"
  };

  it("serializes params without filter groups exactly like kitsu-core, in the same order", () => {
    expect(serializeKitsuParams(params)).toEqual(query(params));
    expect(serializeKitsuParams({ filter: "raw", sort: "name" })).toEqual(
      query({ filter: "raw", sort: "name" })
    );
    expect(
      serializeKitsuParams({ fiql: "name==a;b==c", page: { limit: 1 } })
    ).toEqual(query({ fiql: "name==a;b==c", page: { limit: 1 } }));
  });

  it("uses the grouped syntax for filter objects with groups", () => {
    expect(
      serializeKitsuParams({
        filter: { $or: [{ a: { EQ: 1 } }, { b: { EQ: 2 } }] },
        sort: "name"
      })
    ).toEqual("(filter%5Ba%5D%5BEQ%5D=1|filter%5Bb%5D%5BEQ%5D=2)&sort=name");
  });

  it("omits an empty filter object", () => {
    expect(serializeKitsuParams({ filter: {}, sort: "name" })).toEqual(
      "sort=name"
    );
  });

  it("keeps kitsu's shape for the filters it does not model", () => {
    for (const params of [
      { filter: { id: ["a", "b"] }, sort: "name" },
      { filter: { uuid: { IN: ["a", "b"] } } },
      { filter: { name: "" }, page: { limit: 1000 } }
    ]) {
      expect(serializeKitsuParams(params)).toEqual(query(params));
    }
  });
});

describe("simpleSearchFilterToQueryString values the back-end can't read as they are", () => {
  it.each([
    // [condition on "name", what the back-end parses]
    {
      condition: { EQ: "T77306P-sp-a b" },
      sent: "filter[name][EQ]=T77306P-sp-a b"
    },
    {
      condition: { EQ: "T77306P-comma-a,b" },
      sent: 'filter[name][IN]="T77306P-comma-a,b"'
    },
    {
      condition: { EQ: "T77306P-semi-a;b" },
      sent: 'filter[name][IN]="T77306P-semi-a;b"'
    },
    {
      condition: { EQ: "T77306P-bs-a\\b" },
      sent: 'filter[name][IN]="T77306P-bs-a\\\\b"'
    },
    { condition: { EQ: "a IN b" }, sent: 'filter[name][IN]="a IN b"' },
    {
      // A double quote can't be sent: the value matches nothing instead of another value.
      condition: { EQ: 'T77306P-dq-a"b' },
      sent: 'filter[name][IN]="T77306P-dq-a_b"'
    },
    { condition: { EQ: "a_IN" }, sent: 'filter[name][IN]="a_IN"' },
    { condition: { EQ: "" }, sent: 'filter[name][IN]=""' },
    { condition: { EQ: null }, sent: "filter[name][EQ]=null" },
    { condition: { EQ: false }, sent: "filter[name][EQ]=false" },
    { condition: { IN: "aafc,cnc" }, sent: "filter[name][IN]=aafc,cnc" },
    { condition: { IN: "a;b, c" }, sent: 'filter[name][IN]="a;b",c' },
    { condition: { IN: " , " }, sent: 'filter[name][IN]=""' },
    {
      condition: { ILIKE: "%O'Brien%" },
      sent: "filter[name][ILIKE]=%o_brien%"
    },
    {
      condition: { ILIKE: "%IN SITU%" },
      sent: "filter[name][ILIKE]=%in situ%"
    },
    {
      condition: { ILIKE: "%upper LIMIT%" },
      sent: "filter[name][ILIKE]=%upper _imit%"
    },
    {
      condition: { ILIKE: "%limit_5%" },
      sent: "filter[name][ILIKE]=%_imit_5%"
    },
    {
      // Only ASCII letters are lower-cased; the back-end lower-cases the rest.
      condition: { ILIKE: "%İstanbul%" },
      sent: "filter[name][ILIKE]=%İstanbul%"
    },
    { condition: { ILIKE: "%a*b%" }, sent: "filter[name][ILIKE]=%a%b%" },
    { condition: { ILIKE: "" }, sent: 'filter[name][IN]=""' },
    { condition: { LIKE: "%" }, sent: "filter[name][LIKE]=%" },
    { condition: { LIKE: "a IN b" }, sent: "filter[name][LIKE]=a _N b" },
    // Replacing a letter can leave another keyword.
    { condition: { LIKE: "%NEQ%" }, sent: "filter[name][LIKE]=%__Q%" },
    { condition: { NEQ: "O'Brien" }, sent: "filter[name][NEQ]=O_Brien" },
    // NEQ skips legacy lexer rules so valid identifiers are sent unchanged.
    { condition: { NEQ: "a_IN" }, sent: "filter[name][NEQ]=a_IN" },
    { condition: { NEQ: "IN2023" }, sent: "filter[name][NEQ]=IN2023" },
    // Other values change anyway, so every lexer reads them whole.
    { condition: { NEQ: "a NEQ b" }, sent: "filter[name][NEQ]=a __Q b" },
    { condition: { NEQ: "" }, sent: 'filter[name][NEQ]=""' },
    {
      condition: { GOE: "2026-10-13T07:00:00.000Z" },
      sent: "filter[name][GOE]=2026-10-13T07:00:00.000Z"
    },
    {
      condition: { GOE: "2026-10-13T00:00:00+05:30" },
      sent: "filter[name][GOE]=2026-10-13T00:00:00_05:30"
    },
    { condition: { NOT_ILIKE: "" }, sent: 'filter[name][NOT_ILIKE]=""' }
  ] as { condition: any; sent: string }[])("$sent", ({ condition, sent }) => {
    expect(decoded({ name: condition })).toEqual(sent);
  });

  it("never sends a value the back-end would end early or drop characters from", () => {
    // One value the grammar reads whole: plain characters, or a quoted string (SimpleSearchFilter.g4).
    const value = '("[^"]*"|[\\p{L}0-9_\\-.%/: ]+)';
    const readWhole = new RegExp(
      `^filter\\[name\\]\\[\\w+\\]=${value}(,${value})*$`,
      "su"
    );
    const hostile = Array.from(
      "a b,é;()'&|\"*%_+#@\\/:=!°–µ😀[]~$?<>^{}`\t"
    ).flatMap((character) => [`x${character}y`, `${character}`, ""]);
    hostile.push("IN", "x LIKE y", "1EQ", "a_IN", "NEQ", "limit", "fiql");
    for (const text of hostile) {
      for (const op of [
        "EQ",
        "NEQ",
        "LIKE",
        "ILIKE",
        "IN",
        "GT",
        "NOT_ILIKE"
      ]) {
        const sent = decoded({ name: { [op]: text } });
        if (!sent) {
          // Only an empty IN list adds no condition.
          expect([text, op]).toEqual(["", "IN"]);
          continue;
        }
        expect([text, op, sent, readWhole.test(sent)]).toEqual([
          text,
          op,
          sent,
          true
        ]);
        // No keyword is left outside the quoted values.
        const unquoted = sent.replace(/^[^=]*=/, "").replace(/"[^"]*"/g, ",");
        // NEQ uses non-legacy lexer rules (see sendableCondition).
        expect([
          text,
          op,
          filterKeywordPositions(unquoted, { legacyLexer: op !== "NEQ" })
        ]).toEqual([text, op, []]);
      }
    }
  });

  it("sends an OR of one field and operator as one comma list, which every module reads", () => {
    expect(
      decoded({
        $or: [
          { displayName: { ILIKE: "%bravo%" } },
          { displayName: { ILIKE: "%O'Brien%" } }
        ]
      })
    ).toEqual("filter[displayName][ILIKE]=%bravo%,%o_brien%");
    // Equalities and IN lists share an IN list.
    expect(
      decoded({
        $or: [
          { name: { EQ: "a b" } },
          { name: { EQ: "c,d" } },
          { name: { IN: "x,y" } }
        ]
      })
    ).toEqual('filter[name][IN]=a b,"c,d",x,y');
    // Equalities with a double quote or surrounding spaces are quoted IN values too.
    expect(
      decoded({ $or: [{ name: { EQ: 'a"b' } }, { name: { EQ: " c" } }] })
    ).toEqual('filter[name][IN]="a_b"," c"');
    // Other OR groups use the grouped syntax.
    expect(decoded({ $or: [{ a: { EQ: "1" } }, { b: { EQ: "2" } }] })).toEqual(
      "(filter[a][EQ]=1|filter[b][EQ]=2)"
    );
    expect(decoded({ $or: [{ a: { LT: "1" } }, { a: { GT: "2" } }] })).toEqual(
      "(filter[a][LT]=1|filter[a][GT]=2)"
    );
  });

  it("sends a long value full of keywords with the first letter of each keyword replaced", () => {
    // Verify bulk keyword replacement without timing assertions.
    expect(decoded({ name: { LIKE: "IN ".repeat(50000) } })).toEqual(
      `filter[name][LIKE]=${"_N ".repeat(50000)}`
    );
  });

  it("leaves operator-less values as kitsu-core sends them, for the audit snapshot endpoint", () => {
    for (const filter of [
      { author: "dina-su", instanceId: "metadata/01a1" },
      { name: "a;b|c" }
    ]) {
      expect(simpleSearchFilterToQueryString(filter)).toEqual(
        query({ filter })
      );
    }
  });
});
