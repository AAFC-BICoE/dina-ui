import { MultilingualDescription } from "../../../../dina-ui/types/common/";
import { mountWithAppContext } from "../../test-util/mock-app-context";
import { descriptionCell, LANGUAGE_BADGE_KEYS } from "../multilingual-cells";

const fieldName = "myDescriptionField";
const englishDescription = "English description";
const frenchDescription = "French description";

const descriptionDataBoth: MultilingualDescription = {
  descriptions: [
    {
      lang: "en",
      desc: englishDescription
    },
    {
      lang: "fr",
      desc: frenchDescription
    }
  ]
};

const descriptionDataFr: MultilingualDescription = {
  descriptions: [
    {
      lang: "fr",
      desc: frenchDescription
    }
  ]
};

const descriptionDataBlank: MultilingualDescription = {
  descriptions: [
    {
      lang: "en",
      desc: ""
    }
  ]
};

const descriptionDataEnBlank: MultilingualDescription = {
  descriptions: [
    {
      lang: "en",
      desc: ""
    },
    {
      lang: "fr",
      desc: frenchDescription
    }
  ]
};

describe("descriptionCell", () => {
  it("Both description languages provided, english as selected language.", () => {
    const cell = descriptionCell(fieldName);

    const wrapper = mountWithAppContext(
      <cell.Cell original={{ myDescriptionField: descriptionDataBoth }} />
    );

    expect(cell.accessor).toEqual(fieldName);
    expect(wrapper.find(".badge").text()).toEqual(LANGUAGE_BADGE_KEYS.en);
    expect(wrapper.find(".description").text()).toEqual(englishDescription);
  });

  it("French description provided, english as selected language.", () => {
    const cell = descriptionCell(fieldName);

    const wrapper = mountWithAppContext(
      <cell.Cell original={{ myDescriptionField: descriptionDataFr }} />
    );

    expect(cell.accessor).toEqual(fieldName);
    expect(wrapper.find(".badge").text()).toEqual(LANGUAGE_BADGE_KEYS.fr);
    expect(wrapper.find(".description").text()).toEqual(frenchDescription);
  });

  it("Blank/Null descriptions provided, should be blank", () => {
    const cell = descriptionCell(fieldName);

    const wrapper = mountWithAppContext(
      <cell.Cell original={{ myDescriptionField: descriptionDataBlank }} />
    );

    expect(cell.accessor).toEqual(fieldName);
    expect(wrapper.text()).toEqual("");
  });

  it("Selected language blank, other language description provided", () => {
    const cell = descriptionCell(fieldName);

    const wrapper = mountWithAppContext(
      <cell.Cell original={{ myDescriptionField: descriptionDataEnBlank }} />
    );

    expect(cell.accessor).toEqual(fieldName);
    expect(wrapper.find(".badge").text()).toEqual(LANGUAGE_BADGE_KEYS.fr);
    expect(wrapper.find(".description").text()).toEqual(frenchDescription);
  });
});
