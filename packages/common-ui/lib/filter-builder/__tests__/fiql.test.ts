import { FilterParam } from "kitsu";
import { FilterGroupModel } from "../FilterGroup";
import {
  fiql,
  fiqlArgument,
  filterOrFiqlParams,
  simpleSearchFilterToFiql
} from "../fiql";
import { SimpleSearchFilterBuilder } from "../../util/simpleSearchFilterBuilder";

describe("fiql conversion", () => {
  it("Converts from a filter model to fiql.", () => {
    const fiqlFilter = fiql({
      children: [
        {
          children: [
            {
              attribute: "name",
              id: 1,
              predicate: "IS",
              searchType: "EXACT_MATCH",
              type: "FILTER_ROW",
              value: "101F"
            },
            {
              attribute: "group.groupName",
              id: 3,
              predicate: "IS",
              searchType: "EXACT_MATCH",
              type: "FILTER_ROW",
              value: "poffm"
            }
          ],
          id: 4,
          operator: "OR",
          type: "FILTER_GROUP"
        },
        {
          attribute: "name",
          id: 5,
          predicate: "IS NOT",
          searchType: "EXACT_MATCH",
          type: "FILTER_ROW",
          value: "1075R"
        }
      ],
      id: 6,
      operator: "AND",
      type: "FILTER_GROUP"
    });

    expect(fiqlFilter).toEqual(
      "(name==101F,group.groupName==poffm);name!=1075R"
    );
  });

  it("Returns a blank string when no filter is passed.", () => {
    const fiqlFilter = fiql(null);
    expect(fiqlFilter).toEqual("");
  });

  it("Surrounds the filter value with asterisks when a partial match is requested.", () => {
    const model: FilterGroupModel = {
      children: [
        {
          attribute: "name",
          id: 1,
          predicate: "IS",
          searchType: "PARTIAL_MATCH",
          type: "FILTER_ROW",
          value: "101F"
        }
      ],
      id: 6,
      operator: "AND",
      type: "FILTER_GROUP"
    };
    const fiqlFilter = fiql(model);
    expect(fiqlFilter).toEqual("name==*101F*");
  });

  it("Leaves the filter attribute as is when an exact match is requested.", () => {
    const model: FilterGroupModel = {
      children: [
        {
          attribute: "name",
          id: 1,
          predicate: "IS",
          searchType: "EXACT_MATCH",
          type: "FILTER_ROW",
          value: "101F"
        }
      ],
      id: 6,
      operator: "AND",
      type: "FILTER_GROUP"
    };
    const fiqlFilter = fiql(model);
    expect(fiqlFilter).toEqual("name==101F");
  });

  it("Allows a filter for blank fields.", () => {
    const model: FilterGroupModel = {
      children: [
        {
          attribute: "description",
          id: 1,
          predicate: "IS",
          searchType: "BLANK_FIELD",
          type: "FILTER_ROW",
          value: "this attribute shouldn't matter"
        }
      ],
      id: 6,
      operator: "AND",
      type: "FILTER_GROUP"
    };

    const fiqlFilter = fiql(model);
    expect(fiqlFilter).toEqual("description==null");
  });

  it("Allows a filter for NOT blank fields.", () => {
    const model: FilterGroupModel = {
      children: [
        {
          attribute: "description",
          id: 1,
          predicate: "IS NOT",
          searchType: "BLANK_FIELD",
          type: "FILTER_ROW",
          value: "this attribute shouldn't matter"
        }
      ],
      id: 6,
      operator: "AND",
      type: "FILTER_GROUP"
    };

    // A text field has a value if it matches LIKE "%", "*" in FIQL
    const fiqlFilter = fiql(model);
    expect(fiqlFilter).toEqual("description==*");
  });

  it("Allows a range filter.", () => {
    const model: FilterGroupModel = {
      children: [
        {
          attribute: {
            allowRange: true,
            label: "Number",
            name: "number"
          },
          id: 1,
          predicate: "IS",
          searchType: "PARTIAL_MATCH",
          type: "FILTER_ROW",
          value: "100-200"
        }
      ],
      id: 6,
      operator: "AND",
      type: "FILTER_GROUP"
    };

    const fiqlFilter = fiql(model);
    expect(fiqlFilter).toEqual("number=ge=100;number=le=200");
  });

  it("Allows a range filter written backwards.", () => {
    const model: FilterGroupModel = {
      children: [
        {
          attribute: {
            allowRange: true,
            label: "Number",
            name: "number"
          },
          id: 1,
          predicate: "IS",
          searchType: "PARTIAL_MATCH",
          type: "FILTER_ROW",
          value: "200-100"
        }
      ],
      id: 6,
      operator: "AND",
      type: "FILTER_GROUP"
    };

    const fiqlFilter = fiql(model);
    expect(fiqlFilter).toEqual("number=ge=100;number=le=200");
  });

  it("Allows date IS filter.", () => {
    const model: FilterGroupModel = {
      children: [
        {
          attribute: {
            name: "myDateField",
            label: "My Date Field",
            type: "DATE"
          },
          id: 1,
          predicate: "IS",
          searchType: "PARTIAL_MATCH",
          type: "FILTER_ROW",
          value:
            "Tue Oct 06 2020 20:14:30 GMT+0000 (Coordinated Universal Time)"
        }
      ],
      id: 6,
      operator: "AND",
      type: "FILTER_GROUP"
    };

    const fiqlFilter = fiql(model);
    expect(fiqlFilter).toEqual(
      // Greater than or equal to {beginning of day} AND less than or equal to {end of day}:
      "myDateField=ge=2020-10-06T00:00:00-00:00;myDateField=le=2020-10-06T23:59:59-00:00"
    );
  });

  it("Allows date IS NOT filter.", () => {
    const model: FilterGroupModel = {
      children: [
        {
          attribute: {
            name: "myDateField",
            label: "My Date Field",
            type: "DATE"
          },
          id: 1,
          predicate: "IS NOT",
          searchType: "PARTIAL_MATCH",
          type: "FILTER_ROW",
          value:
            "Tue Oct 06 2020 20:14:30 GMT+0000 (Coordinated Universal Time)"
        }
      ],
      id: 6,
      operator: "AND",
      type: "FILTER_GROUP"
    };

    const fiqlFilter = fiql(model);
    expect(fiqlFilter).toEqual(
      // Less than {beginning of day} OR greater than {end of day}:
      "myDateField=lt=2020-10-06T00:00:00-00:00,myDateField=gt=2020-10-06T23:59:59-00:00"
    );
  });

  it("Allows date FROM filter.", () => {
    const model: FilterGroupModel = {
      children: [
        {
          attribute: {
            name: "myDateField",
            label: "My Date Field",
            type: "DATE"
          },
          id: 1,
          predicate: "FROM",
          searchType: "PARTIAL_MATCH",
          type: "FILTER_ROW",
          value:
            "Tue Oct 06 2020 20:14:30 GMT+0000 (Coordinated Universal Time)"
        }
      ],
      id: 6,
      operator: "AND",
      type: "FILTER_GROUP"
    };

    const fiqlFilter = fiql(model);
    // Greater than or equal to {beginning of day}:
    expect(fiqlFilter).toEqual("myDateField=ge=2020-10-06T00:00:00-00:00");
  });

  it("Allows date UNTIL filter.", () => {
    const model: FilterGroupModel = {
      children: [
        {
          attribute: {
            name: "myDateField",
            label: "My Date Field",
            type: "DATE"
          },
          id: 1,
          predicate: "UNTIL",
          searchType: "PARTIAL_MATCH",
          type: "FILTER_ROW",
          value:
            "Tue Oct 06 2020 20:14:30 GMT+0000 (Coordinated Universal Time)"
        }
      ],
      id: 6,
      operator: "AND",
      type: "FILTER_GROUP"
    };

    const fiqlFilter = fiql(model);
    // Less than or equal to {end of day}:
    expect(fiqlFilter).toEqual("myDateField=le=2020-10-06T23:59:59-00:00");
  });

  it("Allows date BETWEEN filter.", () => {
    const model: FilterGroupModel = {
      children: [
        {
          attribute: {
            name: "myDateField",
            label: "My Date Field",
            type: "DATE"
          },
          id: 1,
          predicate: "BETWEEN",
          searchType: "PARTIAL_MATCH",
          type: "FILTER_ROW",
          value: {
            low: "Tue Oct 06 2020 20:14:30 GMT+0000 (Coordinated Universal Time)",
            high: "Tue Oct 12 2020 21:05:30 GMT+0000 (Coordinated Universal Time)"
          }
        }
      ],
      id: 6,
      operator: "AND",
      type: "FILTER_GROUP"
    };

    const fiqlFilter = fiql(model);
    // From the beginning date to the end date:
    expect(fiqlFilter).toEqual(
      "myDateField=ge=2020-10-06T00:00:00-00:00;myDateField=le=2020-10-12T23:59:59-00:00"
    );
  });

  it("Allows date BETWEEN filter with a backwards range.", () => {
    const model: FilterGroupModel = {
      children: [
        {
          attribute: {
            name: "myDateField",
            label: "My Date Field",
            type: "DATE"
          },
          id: 1,
          predicate: "BETWEEN",
          searchType: "PARTIAL_MATCH",
          type: "FILTER_ROW",
          value: {
            // The high and low values are backwards:
            low: "Tue Oct 12 2020 21:05:30 GMT+0000 (Coordinated Universal Time)",
            high: "Tue Oct 06 2020 20:14:30 GMT+0000 (Coordinated Universal Time)"
          }
        }
      ],
      id: 6,
      operator: "AND",
      type: "FILTER_GROUP"
    };

    const fiqlFilter = fiql(model);
    // From the beginning date to the end date:
    expect(fiqlFilter).toEqual(
      "myDateField=ge=2020-10-06T00:00:00-00:00;myDateField=le=2020-10-12T23:59:59-00:00"
    );
  });

  it("Converts a dropdown-type filter with a null ID value.", () => {
    const model: FilterGroupModel = {
      children: [
        {
          attribute: {
            name: "acMetadataCreator",
            type: "DROPDOWN",
            resourcePath: "agent-api/person"
          },
          id: 3,
          predicate: "IS",
          searchType: "EXACT_MATCH",
          type: "FILTER_ROW",
          // Null ID:
          value: { id: null } as any
        }
      ],
      id: 4,
      operator: "AND",
      type: "FILTER_GROUP"
    };

    const fiqlFilter = fiql(model);
    expect(fiqlFilter).toEqual("acMetadataCreator==null");
  });

  it("Allows IN filter with multiple string values.", () => {
    const model: FilterGroupModel = {
      children: [
        {
          attribute: "group",
          id: 1,
          predicate: "IN",
          searchType: "EXACT_MATCH",
          type: "FILTER_ROW",
          value: ["test", "test2", "test3"]
        }
      ],
      id: 6,
      operator: "AND",
      type: "FILTER_GROUP"
    };

    const fiqlFilter = fiql(model);
    expect(fiqlFilter).toEqual("group==test,group==test2,group==test3");
  });

  it("Allows NOT IN filter with multiple string values.", () => {
    const model: FilterGroupModel = {
      children: [
        {
          attribute: "group",
          id: 1,
          predicate: "NOT IN",
          searchType: "EXACT_MATCH",
          type: "FILTER_ROW",
          value: ["test", "test2"]
        }
      ],
      id: 6,
      operator: "AND",
      type: "FILTER_GROUP"
    };

    const fiqlFilter = fiql(model);
    expect(fiqlFilter).toEqual("group!=test;group!=test2");
  });

  it("Allows IN filter with single value.", () => {
    const model: FilterGroupModel = {
      children: [
        {
          attribute: "status",
          id: 1,
          predicate: "IN",
          searchType: "EXACT_MATCH",
          type: "FILTER_ROW",
          value: ["active"]
        }
      ],
      id: 6,
      operator: "AND",
      type: "FILTER_GROUP"
    };

    const fiqlFilter = fiql(model);
    expect(fiqlFilter).toEqual("status==active");
  });

  it("Allows IN filter with DROPDOWN type resources.", () => {
    const model: FilterGroupModel = {
      children: [
        {
          attribute: {
            name: "managedBy",
            type: "DROPDOWN",
            resourcePath: "agent-api/person"
          },
          id: 1,
          predicate: "IN",
          searchType: "EXACT_MATCH",
          type: "FILTER_ROW",
          value: [
            { id: "person-1", type: "person" },
            { id: "person-2", type: "person" },
            { id: "person-3", type: "person" }
          ]
        }
      ],
      id: 6,
      operator: "AND",
      type: "FILTER_GROUP"
    };

    const fiqlFilter = fiql(model);
    expect(fiqlFilter).toEqual(
      "managedBy==person-1,managedBy==person-2,managedBy==person-3"
    );
  });

  it("Allows NOT IN filter with DROPDOWN type resources.", () => {
    const model: FilterGroupModel = {
      children: [
        {
          attribute: {
            name: "managedBy",
            type: "DROPDOWN",
            resourcePath: "agent-api/person"
          },
          id: 1,
          predicate: "NOT IN",
          searchType: "EXACT_MATCH",
          type: "FILTER_ROW",
          value: [
            { id: "person-1", type: "person" },
            { id: "person-2", type: "person" }
          ]
        }
      ],
      id: 6,
      operator: "AND",
      type: "FILTER_GROUP"
    };

    const fiqlFilter = fiql(model);
    expect(fiqlFilter).toEqual("managedBy!=person-1;managedBy!=person-2");
  });

  it("Allows IN filter with numeric values.", () => {
    const model: FilterGroupModel = {
      children: [
        {
          attribute: "quantity",
          id: 1,
          predicate: "IN",
          searchType: "EXACT_MATCH",
          type: "FILTER_ROW",
          value: [10, 20, 30]
        }
      ],
      id: 6,
      operator: "AND",
      type: "FILTER_GROUP"
    };

    const fiqlFilter = fiql(model);
    expect(fiqlFilter).toEqual("quantity==10,quantity==20,quantity==30");
  });

  it("Combines IN filter with other filters using AND.", () => {
    const model: FilterGroupModel = {
      children: [
        {
          attribute: "group",
          id: 1,
          predicate: "IN",
          searchType: "EXACT_MATCH",
          type: "FILTER_ROW",
          value: ["test", "test2"]
        },
        {
          attribute: "status",
          id: 2,
          predicate: "IS",
          searchType: "EXACT_MATCH",
          type: "FILTER_ROW",
          value: "active"
        }
      ],
      id: 6,
      operator: "AND",
      type: "FILTER_GROUP"
    };

    const fiqlFilter = fiql(model);
    expect(fiqlFilter).toEqual("(group==test,group==test2);status==active");
  });

  it("Combines IN filter with other filters using OR.", () => {
    const model: FilterGroupModel = {
      children: [
        {
          attribute: "group",
          id: 1,
          predicate: "IN",
          searchType: "EXACT_MATCH",
          type: "FILTER_ROW",
          value: ["test", "test2"]
        },
        {
          attribute: "status",
          id: 2,
          predicate: "IS",
          searchType: "EXACT_MATCH",
          type: "FILTER_ROW",
          value: "active"
        }
      ],
      id: 6,
      operator: "OR",
      type: "FILTER_GROUP"
    };

    const fiqlFilter = fiql(model);
    expect(fiqlFilter).toEqual("(group==test,group==test2),status==active");
  });

  it("Combines multiple groups and operators.", () => {
    const model: FilterGroupModel = {
      type: "FILTER_GROUP",
      operator: "AND",
      id: 1,
      children: [
        {
          type: "FILTER_ROW",
          id: 2,
          attribute: "group",
          predicate: "IN",
          searchType: "EXACT_MATCH",
          value: ["aafc", "cnc"]
        },
        {
          type: "FILTER_GROUP",
          operator: "OR",
          id: 3,
          children: [
            {
              type: "FILTER_ROW",
              id: 4,
              attribute: "createdBy",
              predicate: "IS",
              searchType: "EXACT_MATCH",
              value: "dina-admin"
            },
            {
              type: "FILTER_ROW",
              id: 5,
              attribute: "restrictToCreatedBy",
              predicate: "IS",
              searchType: "EXACT_MATCH",
              value: "false"
            }
          ]
        }
      ]
    };

    const fiqlFilter = fiql(model);
    expect(fiqlFilter).toEqual(
      "(group==aafc,group==cnc);(createdBy==dina-admin,restrictToCreatedBy==false)"
    );
  });

  describe("simpleSearchFilterToFiql", () => {
    it("Converts a FilterParam to fiql correctly.", () => {
      const filterParam: FilterParam = {
        name: { ILIKE: "%test%" },
        description: { EQ: null },
        age: { GT: 18, LT: 65 },
        status: { IN: "active,pending" }
      };

      const fiqlFilter = simpleSearchFilterToFiql(filterParam);
      // FIQL has no "in" operator so IN becomes an OR of equalities.
      expect(fiqlFilter).toEqual(
        "name==*test*;description==null;age=gt=18;age=lt=65;(status==active,status==pending)"
      );
    });

    it("Converts legacy operator-less values to equalities.", () => {
      expect(
        simpleSearchFilterToFiql({
          name: "todo 2",
          blank: "",
          group: { EQ: "aafc" }
        })
      ).toEqual("name==todo 2;group==aafc");
    });

    it("Converts a plain null to a blank-field search, like { EQ: null } does.", () => {
      expect(simpleSearchFilterToFiql({ a: null, b: { EQ: null } })).toEqual(
        "a==null;b==null"
      );
    });

    it("Never renders an empty group, which the back-end's parser rejects.", () => {
      // Members with no conditions widen the group to match anything.
      expect(
        simpleSearchFilterToFiql({ $or: [{ a: {} }, { b: { EQ: 1 } }] })
      ).toEqual("b==1");
      expect(simpleSearchFilterToFiql({ $or: [{ a: {} }, { b: {} }] })).toEqual(
        ""
      );
    });

    it('Emits no term for an empty IN list, rather than the invalid "field==".', () => {
      expect(simpleSearchFilterToFiql({ group: { IN: "" } })).toEqual("");
      expect(simpleSearchFilterToFiql({ group: { IN: [] } })).toEqual("");
      expect(
        simpleSearchFilterToFiql({ group: { IN: [] }, name: { EQ: "x" } })
      ).toEqual("name==x");
    });

    it("Converts an IN given as an array without splitting its values.", () => {
      // A lone IN at the root needs no parentheses but next to a sibling it does.
      expect(
        simpleSearchFilterToFiql({ group: { IN: ["aafc", "cnc"] } })
      ).toEqual("group==aafc,group==cnc");
      expect(
        simpleSearchFilterToFiql({
          group: { IN: ["aafc", "cnc"] },
          name: { EQ: "x" }
        })
      ).toEqual("(group==aafc,group==cnc);name==x");
      // FIQL can't carry a comma in a value, so it becomes the "*" wildcard.
      expect(
        simpleSearchFilterToFiql({ city: { IN: ["New York, NY", "Ottawa"] } })
      ).toEqual("city==New York* NY,city==Ottawa");
      // Quoted IN list values are read as one value
      expect(
        simpleSearchFilterToFiql({ city: { IN: '"New York, NY",Ottawa' } })
      ).toEqual("city==New York* NY,city==Ottawa");
    });

    it("Converts every operator.", () => {
      expect(
        simpleSearchFilterToFiql({
          a: { EQ: "x", NEQ: "y", GT: 1, GOE: 2, LT: 3, LOE: 4 },
          b: { LIKE: "x%", ILIKE: "%y%", NOT_ILIKE: "%z%", IN: "1" }
        })
      ).toEqual(
        "a==x;a!=y;a=gt=1;a=ge=2;a=lt=3;a=le=4;b==x*;b==*y*;b!=*z*;b==1"
      );
    });

    it("Converts OR and AND groups, only adding parentheses where needed.", () => {
      expect(
        simpleSearchFilterToFiql(
          SimpleSearchFilterBuilder.create()
            .where("group", "EQ", "aafc")
            .or((b) =>
              b
                .where("createdBy", "EQ", "me")
                .where("restrictToCreatedBy", "EQ", false)
            )
            .build()
        )
      ).toEqual("group==aafc;(createdBy==me,restrictToCreatedBy==false)");

      // Lone OR groups at the root need no parentheses.
      expect(
        simpleSearchFilterToFiql({ $or: [{ a: { EQ: 1 } }, { b: { EQ: 2 } }] })
      ).toEqual("a==1,b==2");

      // Nested groups and $and members are added directly to the parent AND.
      expect(
        simpleSearchFilterToFiql({
          $or: [{ a: { EQ: 1 } }, { b: { EQ: 2 }, c: { EQ: 3 } }],
          $and: [
            { d: { NEQ: "x" } },
            { $or: [{ e: { EQ: 5 } }, { f: { IN: "6,7" } }] }
          ]
        })
      ).toEqual("(a==1,(b==2;c==3));d!=x;(e==5,(f==6,f==7))");
    });

    it("Sends values unquoted, with the * wildcard for characters FIQL can't carry.", () => {
      // The back-end keeps double quotes as part of a value, so a quoted value never matches.
      expect(
        simpleSearchFilterToFiql(
          SimpleSearchFilterBuilder.create()
            .searchFilter("name", "John Smith")
            .where("email", "EQ", "john@example.com")
            .whereIn("group", ["a b", "c"])
            .build()
        )
      ).toEqual(
        "name==*John Smith*;email==john*example.com;(group==a b,group==c)"
      );
    });

    it("Quotes a negated value FIQL can't carry as before, so it excludes nothing rather than too much.", () => {
      expect(
        simpleSearchFilterToFiql({
          name: { NOT_ILIKE: "%O'Brien%" },
          code: { NEQ: "a;b" },
          remarks: { NOT_ILIKE: "%two words%" }
        })
      ).toEqual('name!="*O\'Brien*";code!="a;b";remarks!=*two words*');
    });

    it("Sends UTC date-times with a -00:00 offset and no milliseconds, which FIQL reads.", () => {
      expect(
        simpleSearchFilterToFiql({
          createdOn: {
            GOE: "2026-10-13T07:00:00.000Z",
            LT: "2026-10-14T06:59:59.999Z"
          }
        })
      ).toEqual(
        "createdOn=ge=2026-10-13T07:00:00-00:00;createdOn=lt=2026-10-14T06:59:59-00:00"
      );
    });

    it("Returns an empty string when no FilterParam is provided.", () => {
      const fiqlFilter = simpleSearchFilterToFiql(undefined);
      expect(fiqlFilter).toEqual("");
    });

    it("Returns an empty string when an empty FilterParam is provided.", () => {
      const fiqlFilter = simpleSearchFilterToFiql({});
      expect(fiqlFilter).toEqual("");
    });
  });

  describe("free-text search", () => {
    it("Converts a free-text search to an OR of partial matches on each attribute.", () => {
      const fiqlFilter = fiql({
        type: "FREE_TEXT_SEARCH_FILTER",
        value: "john",
        filterAttributes: ["username", "labels.en"]
      });
      expect(fiqlFilter).toEqual("username==*john*,labels.en==*john*");
    });

    it("Sends free-text values with spaces or other characters unquoted.", () => {
      expect(
        fiql({
          type: "FREE_TEXT_SEARCH_FILTER",
          value: "John Smith",
          filterAttributes: ["name"]
        })
      ).toEqual("name==*John Smith*");

      expect(
        fiql({
          type: "FREE_TEXT_SEARCH_FILTER",
          value: "john@example.com",
          filterAttributes: ["emailAddress"]
        })
      ).toEqual("emailAddress==*john*example.com*");
    });

    it("Sends partial and exact match filter row values unquoted.", () => {
      const model: FilterGroupModel = {
        children: [
          {
            attribute: "name",
            id: 1,
            predicate: "IS",
            searchType: "PARTIAL_MATCH",
            type: "FILTER_ROW",
            value: "John Smith"
          }
        ],
        id: 2,
        operator: "AND",
        type: "FILTER_GROUP"
      };
      expect(fiql(model)).toEqual("name==*John Smith*");
    });

    it("Keeps a * in an exact match a wildcard.", () => {
      const row = (predicate: "IS" | "IS NOT") =>
        fiql({
          attribute: "name",
          id: 1,
          predicate,
          searchType: "EXACT_MATCH",
          type: "FILTER_ROW",
          value: "PR1956*"
        });
      expect(row("IS")).toEqual("name==PR1956*");
      expect(row("IS NOT")).toEqual("name!=PR1956*");
    });

    it("Keeps a typed % or _ next to the * literal in an IS NOT exact match, as before.", () => {
      const isNot = (value: string) =>
        fiql({
          attribute: "name",
          id: 1,
          predicate: "IS NOT",
          searchType: "EXACT_MATCH",
          type: "FILTER_ROW",
          value
        });
      // FIQL reads "*" as the wildcard and "%" and "_" literally
      expect(isNot("PR1956-70%*")).toEqual("name!=PR1956-70%*");
      expect(isNot("%*")).toEqual("name!=%*");
      expect(isNot("T77306P-_mp*")).toEqual("name!=T77306P-_mp*");
    });
  });

  describe("fiqlArgument", () => {
    it("Leaves values the back-end reads as they are.", () => {
      expect(fiqlArgument("abc-123.4/x:y*")).toEqual("abc-123.4/x:y*");
      expect(fiqlArgument("John Smith")).toEqual("John Smith");
      expect(fiqlArgument("écorce µ")).toEqual("écorce µ");
      expect(fiqlArgument("a=b!c")).toEqual("a=b!c");
    });

    it("Replaces characters FIQL can't carry, and keywords, with the * wildcard.", () => {
      expect(fiqlArgument("a;b,c(d)")).toEqual("a*b*c*d*");
      expect(fiqlArgument('say "hi"')).toEqual("say *hi*");
      expect(fiqlArgument("O'Brien & Sons")).toEqual("O*Brien * Sons");
      expect(fiqlArgument("john@example.com")).toEqual("john*example.com");
      // The back-end would end the whole query at these words
      expect(fiqlArgument("IN SITU")).toEqual("*N SITU");
      expect(fiqlArgument("upper limit")).toEqual("upper *imit");
      // Replacing a letter can leave another keyword
      expect(fiqlArgument("NEQ")).toEqual("**Q");
      expect(fiqlArgument("x ILIKE y")).toEqual("x **IKE y");
      // Legacy lexer rules also match keywords adjacent to "_", ".", or digits
      expect(fiqlArgument("a_IN x.EQ.y limit_5")).toEqual(
        "a_*N x.*Q.y *imit_5"
      );
    });

    it("Quotes a value that would become only the * wildcard, which would match every record.", () => {
      expect(fiqlArgument("'")).toEqual('"\'"');
      expect(fiqlArgument("*'*")).toEqual('"*\'*"');
      expect(fiqlArgument("+#")).toEqual('"+#"');
      // Wildcards typed as such stay wildcards
      expect(fiqlArgument("***")).toEqual("***");
      expect(fiqlArgument("*")).toEqual("*");
      expect(
        simpleSearchFilterToFiql({
          name: { ILIKE: "%'%" },
          code: { EQ: "#" },
          remarks: { NOT_ILIKE: "%a%" }
        })
      ).toEqual('name=="*\'*";code=="#";remarks!=*a*');
    });

    it("Quotes a negated value FIQL can't carry instead.", () => {
      expect(fiqlArgument("John Smith", true)).toEqual("John Smith");
      expect(fiqlArgument("O'Brien", true)).toEqual('"O\'Brien"');
      expect(fiqlArgument("IN SITU", true)).toEqual('"IN SITU"');
      // A double quote can't be quoted
      expect(fiqlArgument('say "hi"', true)).toEqual('"say hi"');
      // Keywords only matched by the legacy lexer are preserved when negated
      expect(fiqlArgument("*tube_IN* x.EQ.y IN2023 limit_5", true)).toEqual(
        "*tube_IN* x.EQ.y IN2023 limit_5"
      );
    });
  });

  describe("filterOrFiqlParams", () => {
    it("Sends a filter as the simple filter, and only a filter with a negated pattern as FIQL.", () => {
      const filter = { name: { ILIKE: "%a%" }, group: { EQ: "aafc" } };
      expect(filterOrFiqlParams(filter)).toEqual({ filter });
      expect(
        filterOrFiqlParams({
          group: { EQ: "aafc" },
          $or: [{ a: { EQ: "1" } }, { b: { NOT_ILIKE: "%x%" } }]
        })
      ).toEqual({ fiql: "group==aafc;(a==1,b!=*x*)" });
      // A second OR group is in $and
      expect(
        filterOrFiqlParams(
          SimpleSearchFilterBuilder.create()
            .or((b) => b.where("a", "EQ", "1").where("b", "EQ", "2"))
            .or((b) => b.where("c", "EQ", "3").add({ d: { NOT_ILIKE: "%x%" } }))
            .build()
        )
      ).toEqual({ fiql: "(a==1,b==2);(c==3,d!=*x*)" });
      // A NEQ with "*" (an "IS NOT" + "Exact Match" row) is a negated pattern too
      expect(filterOrFiqlParams({ name: { NEQ: "PR1956-70%*" } })).toEqual({
        fiql: "name!=PR1956-70%*"
      });
      expect(filterOrFiqlParams({ name: { NEQ: "PR1956-70%" } })).toEqual({
        filter: { name: { NEQ: "PR1956-70%" } }
      });
    });

    it("Sends nothing for an empty filter.", () => {
      expect(filterOrFiqlParams(undefined)).toEqual({});
      expect(filterOrFiqlParams({})).toEqual({});
      expect(filterOrFiqlParams({ group: { IN: "" } })).toEqual({});
    });
  });
});
