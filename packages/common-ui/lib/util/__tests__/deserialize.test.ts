import { deserialize } from "../deserialize";

describe("deserialize function", () => {
  it("deserializes a single item response (object instead of array)", async () => {
    const input = {
      data: {
        id: "1",
        type: "article",
        attributes: { title: "Hello World" },
        relationships: {
          author: {
            data: { id: "10", type: "user" }
          }
        }
      }
    };

    const expected = {
      id: "1",
      type: "article",
      title: "Hello World",
      author: {
        id: "10",
        type: "user"
      }
    };

    expect(await deserialize(input)).toEqual(expected);
  });

  it("Included section are moved to each respective attribute to replace the relationship", async () => {
    const input = {
      data: [
        {
          id: "3a0538a4-a483-4d4b-813b-2ceadd310bee",
          type: "metadata",
          attributes: {
            originalFilename: "RAWCANON-30D.CR2",
            filename: "rawr",
            dcFormat: "image/CR2"
          },
          relationships: {
            derivatives: {
              data: [
                {
                  id: "ee69dd9f-862c-4034-bc20-dde0b52ff56e",
                  type: "derivative"
                },
                {
                  id: "77f87eb5-ac8e-41bc-b195-b7f4e0c00592",
                  type: "derivative"
                }
              ]
            }
          }
        },
        {
          id: "b8a9f92b-cf04-461b-b4b4-d439fd47dac3",
          type: "metadata",
          attributes: {
            originalFilename: "profile_picture.jpg",
            filename: "profile_picture.jpg",
            dcFormat: "image/jpeg"
          },
          relationships: {
            derivatives: {
              data: [
                {
                  id: "7648ba7b-0145-4a12-9912-ef8675b762c9",
                  type: "derivative"
                }
              ]
            }
          }
        },
        {
          id: "3f5cc46b-a247-4195-a3d7-9e4334ece945",
          type: "metadata",
          attributes: {
            originalFilename: "RAWCANON-30D.CR2",
            filename: "RAWCANON-30D.CR2",
            dcFormat: "image/CR2"
          },
          relationships: {
            derivatives: {
              data: [
                {
                  id: "63d2fd88-6d92-45cb-b8fe-2c1d795d1bee",
                  type: "derivative"
                },
                {
                  id: "2feaca8b-34eb-475e-b449-f981e0275b6c",
                  type: "derivative"
                }
              ]
            }
          }
        }
      ],
      included: [
        {
          id: "7648ba7b-0145-4a12-9912-ef8675b762c9",
          type: "derivative",
          attributes: {
            derivativeType: "THUMBNAIL_IMAGE",
            fileExtension: ".jpg"
          }
        },
        {
          id: "77f87eb5-ac8e-41bc-b195-b7f4e0c00592",
          type: "derivative",
          attributes: {
            filename: "IMG_3064.JPG",
            derivativeType: "LARGE_IMAGE"
          }
        },
        {
          id: "2feaca8b-34eb-475e-b449-f981e0275b6c",
          type: "derivative",
          attributes: {
            filename: "IMG_2992_2.JPG",
            derivativeType: "LARGE_IMAGE"
          }
        },
        {
          id: "ee69dd9f-862c-4034-bc20-dde0b52ff56e",
          type: "derivative",
          attributes: {
            derivativeType: "THUMBNAIL_IMAGE",
            fileExtension: ".jpg"
          }
        },
        {
          id: "63d2fd88-6d92-45cb-b8fe-2c1d795d1bee",
          type: "derivative",
          attributes: {
            derivativeType: "THUMBNAIL_IMAGE",
            fileExtension: ".jpg"
          }
        }
      ]
    };

    const expected = [
      {
        id: "3a0538a4-a483-4d4b-813b-2ceadd310bee",
        type: "metadata",
        derivatives: [
          {
            id: "ee69dd9f-862c-4034-bc20-dde0b52ff56e",
            type: "derivative",
            derivativeType: "THUMBNAIL_IMAGE",
            fileExtension: ".jpg"
          },
          {
            id: "77f87eb5-ac8e-41bc-b195-b7f4e0c00592",
            type: "derivative",
            filename: "IMG_3064.JPG",
            derivativeType: "LARGE_IMAGE"
          }
        ],
        originalFilename: "RAWCANON-30D.CR2",
        filename: "rawr",
        dcFormat: "image/CR2"
      },
      {
        id: "b8a9f92b-cf04-461b-b4b4-d439fd47dac3",
        type: "metadata",
        derivatives: [
          {
            id: "7648ba7b-0145-4a12-9912-ef8675b762c9",
            type: "derivative",
            derivativeType: "THUMBNAIL_IMAGE",
            fileExtension: ".jpg"
          }
        ],
        originalFilename: "profile_picture.jpg",
        filename: "profile_picture.jpg",
        dcFormat: "image/jpeg"
      },
      {
        id: "3f5cc46b-a247-4195-a3d7-9e4334ece945",
        type: "metadata",
        derivatives: [
          {
            id: "63d2fd88-6d92-45cb-b8fe-2c1d795d1bee",
            type: "derivative",
            derivativeType: "THUMBNAIL_IMAGE",
            fileExtension: ".jpg"
          },
          {
            id: "2feaca8b-34eb-475e-b449-f981e0275b6c",
            type: "derivative",
            filename: "IMG_2992_2.JPG",
            derivativeType: "LARGE_IMAGE"
          }
        ],
        originalFilename: "RAWCANON-30D.CR2",
        filename: "RAWCANON-30D.CR2",
        dcFormat: "image/CR2"
      }
    ];

    const result = await deserialize(input);

    expect(result).toEqual(expected);
  });

  it("handles payload with no 'included' property", async () => {
    const input = {
      data: [
        {
          id: "1",
          type: "item",
          attributes: { name: "Widget" }
        }
      ]
    };

    const expected = [
      {
        id: "1",
        type: "item",
        name: "Widget"
      }
    ];

    expect(await deserialize(input)).toEqual(expected);
  });

  it("handles relationships when referenced item is missing from 'included'", async () => {
    const input = {
      data: [
        {
          id: "1",
          type: "photo",
          attributes: { title: "Sunset" },
          relationships: {
            tags: {
              data: [
                { id: "100", type: "tag" },
                { id: "101", type: "tag" }
              ]
            }
          }
        }
      ],
      included: [
        // Only tag 100 exists in included
        {
          id: "100",
          type: "tag",
          attributes: { label: "Nature" }
        }
      ]
    };

    const expected = [
      {
        id: "1",
        type: "photo",
        title: "Sunset",
        tags: [
          { id: "100", type: "tag", label: "Nature" },
          { id: "101", type: "tag" } // Resolves cleanly without attributes
        ]
      }
    ];

    expect(await deserialize(input)).toEqual(expected);
  });

  it("handles empty data or invalid inputs gracefully", async () => {
    expect(await deserialize(null)).toBeNull();
    expect(await deserialize(undefined)).toBeUndefined();
    expect(await deserialize({})).toEqual({});
    expect(await deserialize({ data: [] })).toEqual([]);
  });
});
