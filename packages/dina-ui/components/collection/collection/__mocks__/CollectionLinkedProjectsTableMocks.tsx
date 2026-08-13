import { PROJECT_MAPPING } from "common-ui";

export const mockPost = jest.fn((url, data, config) => {
  if (url === "search-api/search-ws/search") {
    if (config.params?.indexName === "dina_material_sample_index") {
      if (
        data.query.bool.must[0].term[
          "data.relationships.collection.data.id"
        ] === "collection-error"
      ) {
        throw new Error("error retriving samples");
      }
      if (
        data.query.bool.must[0].term[
          "data.relationships.collection.data.id"
        ] === "collection-multiple-samples"
      ) {
        return {
          data: {
            took: 12,
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
                value: 2
              },
              hits: []
            },
            aggregations: {
              "sterms#unique_projects": {
                buckets: [
                  {
                    doc_count: 2,
                    key: "019cb00e-a656-734f-8b7c-96f0f4bfa807"
                  }
                ],
                doc_count_error_upper_bound: 0,
                sum_other_doc_count: 0
              }
            }
          }
        };
      }
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
      } else if (
        data.query.bool.must[0].term[
          "data.relationships.collection.data.id"
        ] === "collection-multiple-samples"
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
                value: 2
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
                },
                {
                  _index: "dina_material_sample_index_20260223203349",
                  _id: "019cb97a-60d0-7d82-908b-eef73da266b7",
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
      } else if (
        data.query.bool.must[0].term[
          "data.relationships.collection.data.id"
        ] === "collection-project-error"
      ) {
        return {
          data: {
            took: 12,
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
                value: 2
              },
              hits: []
            },
            aggregations: {
              "sterms#unique_projects": {
                buckets: [
                  {
                    doc_count: 2,
                    key: "019cb00e-a656-734f-8b7c-96f0f4bf3333"
                  }
                ],
                doc_count_error_upper_bound: 0,
                sum_other_doc_count: 0
              }
            }
          }
        };
      }
    }
    if (config.params?.indexName === "dina_project_index") {
      if (
        data.query.terms["data.id"].includes(
          "019cb00e-a656-734f-8b7c-96f0f4bf3333"
        )
      ) {
        throw new Error("error retriving projects");
      }
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
                      endDate: "2026-07-02T19:37:56.07143Z",
                      name: "bal",
                      createdOn: "2026-03-04T19:37:56.07143Z",
                      startDate: "2026-03-02T19:37:56.07143Z",
                      group: "aafc",
                      status: "ongoing"
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
});

export const mockGet = jest.fn((url, params) => {
  if (
    url == "search-api/search-ws/mapping" &&
    params.params?.indexName === "dina_project_index"
  ) {
    return PROJECT_MAPPING;
  }
});
