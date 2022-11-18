import { backButtonAddReloadLastSearchParam } from "../useBackButtonReloadLastSearch";

const mockPush = jest.fn();

const MATERIAL_SAMPLE_LIST = "/material-sample/list";
const MATERIAL_SAMPLE_VIEW = "/material-sample/view";
const MATERIAL_SAMPLE_EDIT = "/material-sample/edit";

describe("useBackButtonReloadLastSearch", () => {
  beforeEach(() => jest.clearAllMocks());

  it("Previous path is list, append the reloadLastSearch", async () => {
    const performNormalBack = backButtonAddReloadLastSearchParam(
      { push: mockPush },
      MATERIAL_SAMPLE_LIST,
      MATERIAL_SAMPLE_VIEW,
      false
    );

    expect(performNormalBack).toEqual(false);
    expect(mockPush).toBeCalledWith(MATERIAL_SAMPLE_LIST + "?reloadLastSearch");
  });

  it("Previous path is list, url already has params, append to end", async () => {
    const performNormalBack = backButtonAddReloadLastSearchParam(
      { push: mockPush },
      MATERIAL_SAMPLE_LIST + "?alreadyHasParam&andAnother",
      MATERIAL_SAMPLE_VIEW,
      false
    );

    expect(performNormalBack).toEqual(false);
    expect(mockPush).toBeCalledWith(
      MATERIAL_SAMPLE_LIST + "?alreadyHasParam&andAnother&reloadLastSearch"
    );
  });

  it("Previous path is list, url already has params, append to end", async () => {
    const performNormalBack = backButtonAddReloadLastSearchParam(
      { push: mockPush },
      MATERIAL_SAMPLE_LIST + "?alreadyHasParam&reloadLastSearch",
      MATERIAL_SAMPLE_VIEW,
      false
    );

    expect(performNormalBack).toEqual(true);
    expect(mockPush).toBeCalledTimes(0);
  });

  it("Previous path is not list, do not append anything to the URL", async () => {
    const performNormalBack = backButtonAddReloadLastSearchParam(
      { push: mockPush },
      MATERIAL_SAMPLE_EDIT + "?alreadyHasParam",
      MATERIAL_SAMPLE_VIEW,
      false
    );

    expect(performNormalBack).toEqual(true);
    expect(mockPush).toBeCalledTimes(0);
  });

  it("Disabled prop is activated, do not append anything to the URL", async () => {
    const performNormalBack = backButtonAddReloadLastSearchParam(
      { push: mockPush },
      MATERIAL_SAMPLE_LIST,
      MATERIAL_SAMPLE_VIEW,
      true
    );

    expect(performNormalBack).toEqual(true);
    expect(mockPush).toBeCalledTimes(0);
  });

  it("Path is the same, do not append anything to the URL", async () => {
    const performNormalBack = backButtonAddReloadLastSearchParam(
      { push: mockPush },
      MATERIAL_SAMPLE_LIST,
      MATERIAL_SAMPLE_LIST,
      false
    );

    expect(performNormalBack).toEqual(true);
    expect(mockPush).toBeCalledTimes(0);
  });
});
