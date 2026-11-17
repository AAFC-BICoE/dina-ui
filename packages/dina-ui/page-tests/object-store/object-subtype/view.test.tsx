import { mountWithAppContext, waitForLoadingToDisappear } from "common-ui";
import ObjectSubtypeViewPage from "../../../pages/object-store/object-subtype/view";
import { ObjectSubtype } from "../../../types/objectstore-api/resources/ObjectSubtype";
import "@testing-library/jest-dom";

jest.mock("next/link", () => ({ children }) => <div>{children}</div>);
jest.mock("next/router", () => ({
  useRouter: () => ({ query: { id: "1" } }),
  withRouter: (component) => component
}));

function testSubtype(systemDefined: boolean): ObjectSubtype {
  return {
    id: "1",
    type: "object-subtype",
    uuid: "1",
    dcType: "DATASET",
    acSubtype: "EXPORT TEMPLATE",
    systemDefined,
    multilingualTitle: { titles: [{ lang: "en", title: "Export Template" }] },
    multilingualDescription: {
      descriptions: [{ lang: "en", desc: "Template used for exports" }]
    }
  };
}

async function renderPage(systemDefined: boolean, isAdmin: boolean) {
  const mockGet = jest.fn(async () => ({ data: testSubtype(systemDefined) }));
  const wrapper = mountWithAppContext(<ObjectSubtypeViewPage />, {
    apiContext: { apiClient: { get: mockGet } } as any,
    accountContext: { isAdmin }
  });
  await waitForLoadingToDisappear();
  return wrapper;
}

describe("Object subtype view page", () => {
  it("Displays the title and description, with edit/delete for admins.", async () => {
    const wrapper = await renderPage(false, true);

    expect(wrapper.getByText("Export Template")).toBeInTheDocument();
    expect(wrapper.getByText("Template used for exports")).toBeInTheDocument();
    expect(
      wrapper.getByRole("button", { name: /delete/i })
    ).toBeInTheDocument();
    expect(wrapper.getByText(/edit/i)).toBeInTheDocument();
  });

  it("Hides edit/delete for system defined subtypes, even for admins.", async () => {
    const wrapper = await renderPage(true, true);

    expect(wrapper.getByText("Export Template")).toBeInTheDocument();
    expect(wrapper.queryByRole("button", { name: /delete/i })).toBeNull();
    expect(wrapper.queryByText(/^edit$/i)).toBeNull();
  });

  it("Hides edit/delete for non-admins.", async () => {
    const wrapper = await renderPage(false, false);

    expect(wrapper.getByText("Export Template")).toBeInTheDocument();
    expect(wrapper.queryByRole("button", { name: /delete/i })).toBeNull();
    expect(wrapper.queryByText(/^edit$/i)).toBeNull();
  });
});
