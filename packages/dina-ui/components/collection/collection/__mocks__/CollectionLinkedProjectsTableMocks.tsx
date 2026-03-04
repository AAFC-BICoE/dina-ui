export const mockPost = jest.fn((url, data, config) => {
  if (url === "search-api/search-ws/search") {
    if (config.params?.indexName === "dina_material_sample_index") {
      if (
        data.query.bool.must[0].term[
          "data.relationships.collection.data.id"
        ] === "collection-123"
      ) {
        return {
          data: {
            took: 48,
            timed_out: false,
            _shards: {
              failed: 0.0,
              successful: 1.0,
              total: 1.0,
              skipped: 0.0
            },
            hits: {
              total: {
                relation: "eq",
                value: 1
              },
              hits: [
                {
                  _index: "dina_material_sample_index_20260223203349",
                  _id: "019cb97a-60d0-7d82-908b-eef73da256b9",
                  _score: 2.7300289,
                  _type: "_doc",
                  _source: {
                    data: {
                      relationships: {
                        projects: {
                          data: [
                            {
                              id: "019cb00e-a656-734f-8b7c-96f0f4bfa807",
                              type: "project"
                            }
                          ]
                        },
                        organism: {
                          data: []
                        },
                        collection: {
                          data: {
                            id: "019cb978-5d56-7ff6-b16a-2e9caf4b890e",
                            type: "collection"
                          }
                        },
                        assemblages: {
                          data: []
                        }
                      }
                    }
                  }
                }
              ],
              max_score: 2.7300289
            }
          }
        };
      }

      if (config.params?.indexName === "dina_project_index") {
        return {
          data: {
            took: 25,
            timed_out: false,
            _shards: {
              failed: 0.0,
              successful: 1.0,
              total: 1.0,
              skipped: 0.0
            },
            hits: {
              total: {
                relation: "eq",
                value: 1
              },
              hits: [
                {
                  _index: "dina_project_index_20260223203401",
                  _id: "019cb00e-a656-734f-8b7c-96f0f4bfa807",
                  _type: "_doc",
                  _source: {
                    data: {
                      attributes: {
                        multilingualDescription: {
                          descriptions: []
                        },
                        createdBy: "dina-admin",
                        endDate: null,
                        name: "bal",
                        createdOn: "2026-03-02T19:37:56.07143Z",
                        startDate: null,
                        group: "aafc",
                        status: null
                      },
                      id: "019cb00e-a656-734f-8b7c-96f0f4bfa807",
                      type: "project"
                    }
                  },
                  sort: [1772480276071]
                }
              ]
            }
          }
        };
      }
    }
  }
});

export const mockGet = jest.fn((url, params) => {
  if (
    url == "search-api/search-ws/mapping" &&
    params.params?.indexName === "dina_project_index"
  ) {
    return {
      data: {
        attributes: [
          {
            name: "createdBy",
            type: "text",
            fields: ["keyword"],
            path: "data.attributes"
          },
          {
            name: "endDate",
            type: "date",
            path: "data.attributes",
            subtype: "local_date"
          },
          {
            name: "name",
            type: "text",
            fields: ["keyword"],
            path: "data.attributes",
            distinct_term_agg: true
          },
          {
            name: "createdOn",
            type: "date",
            path: "data.attributes",
            subtype: "date_time"
          },
          {
            name: "startDate",
            type: "date",
            path: "data.attributes",
            subtype: "local_date"
          },
          {
            name: "status",
            type: "text",
            fields: ["keyword"],
            path: "data.attributes",
            distinct_term_agg: true
          }
        ],
        relationships: [
          {
            referencedBy: "attachment",
            name: "type",
            path: "included",
            value: "metadata",
            attributes: [
              {
                name: "createdBy",
                type: "text",
                path: "attributes"
              },
              {
                name: "acCaption",
                type: "text",
                path: "attributes"
              },
              {
                name: "filename",
                type: "text",
                path: "attributes"
              },
              {
                name: "originalFilename",
                type: "text",
                path: "attributes"
              },
              {
                name: "fileExtension",
                type: "text",
                path: "attributes",
                distinct_term_agg: true
              },
              {
                name: "sourceSet",
                type: "text",
                path: "attributes"
              },
              {
                name: "createdOn",
                type: "date",
                path: "attributes",
                subtype: "date_time"
              },
              {
                name: "dcType",
                type: "text",
                path: "attributes",
                distinct_term_agg: true
              },
              {
                name: "dcFormat",
                type: "text",
                path: "attributes",
                distinct_term_agg: true
              },
              {
                name: "xmpRightsWebStatement",
                type: "text",
                path: "attributes",
                distinct_term_agg: true
              },
              {
                name: "xmpMetadataDate",
                type: "date",
                path: "attributes",
                subtype: "date_time"
              },
              {
                name: "acDigitizationDate",
                type: "date",
                path: "attributes",
                subtype: "date_time"
              },
              {
                name: "publiclyReleasable",
                type: "boolean",
                path: "attributes"
              },
              {
                name: "acTags",
                type: "text",
                path: "attributes"
              },
              {
                name: "managedAttributes",
                type: "object",
                path: "attributes"
              }
            ]
          }
        ],
        index_name: "dina_project_index"
      }
    };
  }
});
