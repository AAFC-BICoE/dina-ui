import { mountWithAppContext } from "common-ui";
import { BackButton } from "../BackButton";
import "@testing-library/jest-dom";

const ENTITY_ID = "108559ed-e000-49c4-95e0-03dee7bfce9b";
const ENTITY_LINK = "/collection/material-sample";

describe("BackButton", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("Back to entity button", () => {
    // Simple back to list button snapshot test.
    const backToEntityButtonWrapper = mountWithAppContext(
      <BackButton entityLink={ENTITY_LINK} entityId={ENTITY_ID} />
    );

    expect(backToEntityButtonWrapper.container).toMatchSnapshot();

    // Try adding a custom className to ensure it's added.
    const classNameTest = mountWithAppContext(
      <BackButton
        entityLink={ENTITY_LINK}
        entityId={ENTITY_ID}
        className="class-name-test"
      />
    );

    expect(classNameTest.container).toMatchSnapshot();
  });

  it("Back to list button", () => {
    // Simple back to list button snapshot test.
    const backToListButtonWrapper = mountWithAppContext(
      <BackButton entityLink={ENTITY_LINK} />
    );

    expect(backToListButtonWrapper.container).toMatchSnapshot();

    // Back to entity but with bypass view option enabled, should point to list.
    const backToEntityButtonWrapper = mountWithAppContext(
      <BackButton
        entityLink={ENTITY_LINK}
        entityId={ENTITY_ID}
        byPassView={true}
      />
    );

    expect(backToEntityButtonWrapper.container).toMatchSnapshot();

    // Test with reload last search option snapshot test.
    const reloadLastSearchWrapper = mountWithAppContext(
      <BackButton entityLink={ENTITY_LINK} />
    );

    expect(reloadLastSearchWrapper.container).toMatchSnapshot();
  });

  it("Remove trailing forward slashes from entity link if provided", () => {
    // Entity link with a "/" added to the end.
    const wrapper = mountWithAppContext(
      <BackButton entityLink={ENTITY_LINK + "/"} />
    );

    // Ensure it's not /collection/material-sample//list
    const backLink = wrapper.getByRole("link", { name: /back to list page/i });
    expect(backLink).toHaveAttribute(
      "href",
      "/collection/material-sample/list"
    );
  });
});
