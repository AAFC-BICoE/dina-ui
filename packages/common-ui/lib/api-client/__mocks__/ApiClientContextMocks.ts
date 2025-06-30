import { Operation, OperationsResponse } from "../operations-types";
import { AxiosRequestConfig } from "axios";

export const AXIOS_JSONPATCH_REQUEST_CONFIG: AxiosRequestConfig = {
  headers: {
    Accept: "application/json-patch+json",
    "Content-Type": "application/json-patch+json",
    "Crnk-Compact": "true"
  }
};

export const TODO_INSERT_OPERATION: Operation[] = [
  {
    op: "POST",
    path: "todo",
    value: {
      attributes: {
        description: "description",
        name: "todo 1"
      },
      id: "123",
      type: "todo"
    }
  }
];

export const MOCK_TODO_INSERT_AXIOS_RESPONSE = {
  data: [
    {
      data: {
        attributes: {
          description: "description",
          name: "todo 1"
        },
        id: "123",
        type: "todo"
      },
      status: 201
    }
  ] as OperationsResponse
};

export const TODO_OPERATION_1_VALID_2_INVALID: Operation[] = [
  {
    op: "POST",
    path: "todo",
    value: {
      attributes: {
        name: "valid-name"
      },
      id: "1",
      type: "todo"
    }
  },
  {
    op: "POST",
    path: "todo",
    value: {
      attributes: {
        name: "this-name-is-too-long"
      },
      id: "2",
      type: "todo"
    }
  },
  {
    op: "POST",
    path: "todo",
    value: {
      attributes: {
        description: "this-description-is-too-long"
      },
      id: "3",
      type: "todo"
    }
  }
];

export const TODO_OPERATION_DENY_ACCESS: Operation[] = [
  {
    op: "POST",
    path: "todo",
    value: {
      attributes: {
        name: "this will fail with an 'access denied' error."
      },
      id: "1",
      type: "todo"
    }
  }
];

export const MOCK_AXIOS_RESPONSE_1_VALID_2_INVALID = {
  data: [
    {
      data: {
        attributes: {
          name: "valid-name"
        },
        id: "1",
        links: { self: "/api/region/1" },
        type: "todo"
      },
      status: 201
    },
    {
      errors: [
        {
          detail: "name size must be between 1 and 10",
          status: "422",
          title: "Constraint violation"
        }
      ],
      status: 422
    },
    {
      errors: [
        {
          detail: "description size must be between 1 and 10",
          status: "422",
          title: "Constraint violation"
        }
      ],
      status: 422
    },
    {
      // The client should be able to ignore a response with no 'errors' field.
      status: 500
    }
  ] as OperationsResponse
};

export const MOCK_AXIOS_RESPONSE_ACCESS_DENIED = {
  data: [
    {
      errors: [
        {
          status: "403",
          code: "Access is denied",
          title: "Access is denied",
          meta: { type: "AccessDeniedException" }
        }
      ],
      status: 403
    }
  ] as OperationsResponse
};

export const MOCK_BULK_GET_DATA = {
  data: [
    {
      id: "1",
      type: "person"
    },
    {
      id: "2",
      type: "person"
    },
    {
      id: "3",
      type: "person"
    }
  ]
};

export const MOCK_BULK_GET_RESPONSE = {
  data: {
    data: [
      {
        attributes: { displayName: "person 1" },
        relationships: {
          organizations: {
            data: [
              {
                id: "12345678-1234-1234-1234-123456789012",
                type: "organization"
              }
            ]
          }
        },
        id: "1",
        type: "person"
      },
      {
        attributes: { displayName: "person 2" },
        id: "2",
        type: "person"
      },
      {
        attributes: { displayName: "person 3" },
        id: "3",
        type: "person"
      }
    ]
  },
  status: 200
};

export const MOCK_BULK_GET_RESPONSE_DESERIALIZED = {
  data: {
    data: [
      {
        displayName: "person 1",
        relationships: {
          organizations: {
            data: [
              {
                id: "12345678-1234-1234-1234-123456789012",
                type: "organization"
              }
            ]
          }
        },
        id: "1",
        type: "person"
      },
      {
        displayName: "person 2",
        id: "2",
        type: "person"
      },
      {
        displayName: "person 3",
        id: "3",
        type: "person"
      }
    ]
  },
  status: 200
};

export const MOCK_BULK_GET_RESPONSE_INCLUDE_ORGANIZATIONS = {
  data: {
    data: [
      {
        attributes: { displayName: "person 1" },
        relationships: {
          organizations: {
            data: [
              {
                id: "12345678-1234-1234-1234-123456789012",
                type: "organization",
                attributes: {
                  createdBy: "dina-admin",
                  createdOn: "2023-10-01T00:00:00Z",
                  names: [
                    {
                      languageCode: "EN",
                      name: "Test Organization"
                    }
                  ]
                }
              }
            ]
          }
        },
        id: "1",
        type: "person"
      },
      {
        displayName: "person 2",
        id: "2",
        type: "person"
      },
      {
        displayName: "person 3",
        id: "3",
        type: "person"
      }
    ]
  },
  status: 200
};

export const MOCK_BULK_GET_RESPONSE_INCLUDE_ORGANIZATIONS_DESERIALIZED = {
  data: {
    data: [
      {
        displayName: "person 1",
        relationships: {
          organizations: {
            data: [
              {
                id: "12345678-1234-1234-1234-123456789012",
                type: "organization",
                attributes: {
                  createdBy: "dina-admin",
                  createdOn: "2023-10-01T00:00:00Z",
                  names: [
                    {
                      languageCode: "EN",
                      name: "Test Organization"
                    }
                  ]
                }
              }
            ]
          }
        },
        id: "1",
        type: "person"
      },
      {
        displayName: "person 2",
        id: "2",
        type: "person"
      },
      {
        displayName: "person 3",
        id: "3",
        type: "person"
      }
    ]
  },
  status: 200
};

export const MOCK_BULK_CREATE_DATA = [
  {
    attributes: {
      displayName: "person 1"
    },

    type: "person"
  },
  {
    attributes: {
      displayName: "person 2"
    },

    type: "person"
  },
  {
    attributes: {
      displayName: "person 3"
    },

    type: "person"
  }
];

export const MOCK_BULK_CREATE_INPUT = [
  {
    displayName: "person 1",

    type: "person"
  },
  {
    displayName: "person 2",

    type: "person"
  },
  {
    displayName: "person 3",

    type: "person"
  }
];

export const MOCK_BULK_UPDATE_DATA = {
  data: [
    {
      id: "1",
      attributes: {
        displayName: "updated person 1"
      },
      type: "person"
    },
    {
      id: "2",
      attributes: {
        displayName: "updated person 2"
      },
      type: "person"
    },
    {
      id: "3",
      attributes: {
        displayName: "updated person 3"
      },
      type: "person"
    }
  ]
};

export const MOCK_BULK_UPDATE_INPUT = [
  {
    id: "1",
    displayName: "updated person 1",
    type: "person"
  },
  {
    id: "2",
    displayName: "updated person 2",
    type: "person"
  },
  {
    id: "3",
    displayName: "updated person 3",
    type: "person"
  }
];

export const MOCK_BULK_UPDATE_RESPONSE = {
  data: {
    data: [
      {
        attributes: { displayName: "updated person 1" },
        id: "1",
        type: "person"
      },
      {
        attributes: { displayName: "updated person 2" },
        id: "2",
        type: "person"
      },
      {
        attributes: { displayName: "updated person 3" },
        id: "3",
        type: "person"
      }
    ]
  },
  status: 200
};

export const MOCK_BULK_UPDATE_RESPONSE_DESERIALIZED = {
  data: {
    data: [
      {
        displayName: "updated person 1",
        id: "1",
        type: "person"
      },
      {
        displayName: "updated person 2",
        id: "2",
        type: "person"
      },
      {
        displayName: "updated person 3",
        id: "3",
        type: "person"
      }
    ]
  },
  status: 200
};

export const MOCK_BULK_DELETE_RESPONSE = {
  data: undefined,
  status: 204
};
