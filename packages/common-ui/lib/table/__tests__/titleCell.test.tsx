import { MultilingualTitle } from "../../../../dina-ui/types/common/";
import { mountWithAppContext } from "../../test-util/mock-app-context";
import { titleCell, LANGUAGE_BADGE_KEYS } from "../multilingual-cells";

const fieldName = "myTitleField";
const englishTitle = "English title";
const frenchTitle = "French title";

const titleDataBoth: MultilingualTitle = {
  titles: [
    {
      lang: "en",
      title: englishTitle
    },
    {
      lang: "fr",
      title: frenchTitle
    }
  ]
};

const titleDataFr: MultilingualTitle = {
  titles: [
    {
      lang: "fr",
      title: frenchTitle
    }
  ]
};

const titleDataBlank: MultilingualTitle = {
  titles: [
    {
      lang: "en",
      title: ""
    }
  ]
};

const titleDataEnBlank: MultilingualTitle = {
  titles: [
    {
      lang: "en",
      title: ""
    },
    {
      lang: "fr",
      title: frenchTitle
    }
  ]
};

describe("titleCell", () => {
  it("Both title languages provided, english as selected language.", () => {
    const cell = titleCell(fieldName);

    const wrapper = mountWithAppContext(
      <cell.Cell original={{ myTitleField: titleDataBoth }} />
    );

    expect(cell.accessor).toEqual(fieldName);
    expect(wrapper.find(".badge").text()).toEqual(LANGUAGE_BADGE_KEYS.en);
    expect(wrapper.find(".title").text()).toEqual(englishTitle);
  });

  it("French title provided, english as selected language.", () => {
    const cell = titleCell(fieldName);

    const wrapper = mountWithAppContext(
      <cell.Cell original={{ myTitleField: titleDataFr }} />
    );

    expect(cell.accessor).toEqual(fieldName);
    expect(wrapper.find(".badge").text()).toEqual(LANGUAGE_BADGE_KEYS.fr);
    expect(wrapper.find(".title").text()).toEqual(frenchTitle);
  });

  it("Blank/Null titles provided, should be blank", () => {
    const cell = titleCell(fieldName);

    const wrapper = mountWithAppContext(
      <cell.Cell original={{ myTitleField: titleDataBlank }} />
    );

    expect(cell.accessor).toEqual(fieldName);
    expect(wrapper.text()).toEqual("");
  });

  it("Selected language blank, other language title provided", () => {
    const cell = titleCell(fieldName);

    const wrapper = mountWithAppContext(
      <cell.Cell original={{ myTitleField: titleDataEnBlank }} />
    );

    expect(cell.accessor).toEqual(fieldName);
    expect(wrapper.find(".badge").text()).toEqual(LANGUAGE_BADGE_KEYS.fr);
    expect(wrapper.find(".title").text()).toEqual(frenchTitle);
  });
});
