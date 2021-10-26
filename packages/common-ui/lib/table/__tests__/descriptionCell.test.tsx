import { descriptionCell } from "../description-cell";
import { mountWithAppContext } from "../../test-util/mock-app-context";
import { MultilingualDescription } from "packages/dina-ui/types/collection-api/resources/PreparationType";
import { getIntlSupport } from "../..";

const { useIntl } = getIntlSupport({
  defaultMessages: {},
  translations: { en: {}, fr: {} }
});

describe("descriptionCell", () => {
  const { setLocale } = useIntl();

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

  const descriptionDataEn: MultilingualDescription = {
    descriptions: [
      {
        lang: "en",
        desc: englishDescription
      }
    ]
  };

  it("Both description languages provided, english as selected language.", () => {
    setLocale("en");

    const cell = descriptionCell(fieldName);

    const wrapper = mountWithAppContext(
      <cell.Cell original={{ myDescriptionField: descriptionDataBoth }} />
    );

    expect(cell.accessor).toEqual(fieldName);
    expect(wrapper.find("div").text()).toEqual(englishDescription);
  });

  it("Both description languages provided, french as the selected language.", () => {
    setLocale("fr");

    const cell = descriptionCell(fieldName);

    const wrapper = mountWithAppContext(
      <cell.Cell original={{ myDescriptionField: descriptionDataBoth }} />
    );

    expect(cell.accessor).toEqual(fieldName);
    expect(wrapper.find("div").text()).toEqual(frenchDescription);
  });

  it("English description provided, language selected is french.", () => {
    setLocale("fr");

    const cell = descriptionCell(fieldName);

    const wrapper = mountWithAppContext(
      <cell.Cell original={{ myDescriptionField: descriptionDataEn }} />
    );
  });
});
