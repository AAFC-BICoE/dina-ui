import { PersistedResource } from "kitsu";
import { DinaForm } from "../../../../../common-ui/lib";
import { mountWithAppContext } from "common-ui";
import { MaterialSample } from "../../../../types/collection-api";
import { MaterialSampleBreadCrumb } from "../MaterialSampleBreadCrumb";
import "@testing-library/jest-dom";

const materialSampleWithHierarchy: PersistedResource<MaterialSample> = {
  id: "A",
  group: "group",
  materialSampleName: "A",
  type: "material-sample",
  hierarchy: [
    { uuid: "A", name: "A" },
    { uuid: "B", name: "B" },
    { uuid: "C", name: "C" }
  ]
};

describe("MaterialSampleBreadCrumb component", () => {
  it("Renders the breadcrumb path from the hierarchy, lastLink disabled", async () => {
    const { container } = mountWithAppContext(
      <DinaForm initialValues={{}}>
        <MaterialSampleBreadCrumb
          materialSample={materialSampleWithHierarchy}
          disableLastLink={true}
        />
      </DinaForm>
    );

    // The currently selected material sample.
    expect(container.querySelector("#wb-cont")?.textContent).toEqual("A");

    // Under the title, it should show all the parents of this selected record.
    const breadcrumbItems = Array.from(
      container.querySelectorAll("li.breadcrumb-item")
    ).map((node) => node.textContent?.trim());
    expect(breadcrumbItems).toEqual(["B", "C"]);

    // It will have 2 links, and the 3rd is plain text for the current sample.
    const links = Array.from(container.querySelectorAll("a")).map((link) =>
      link.getAttribute("href")
    );
    expect(links).toEqual([
      "/collection/material-sample/view?id=B",
      "/collection/material-sample/view?id=C"
    ]);
  });

  it("Renders the breadcrumb path from the hierarchy, lastLink enabled", async () => {
    const { container } = mountWithAppContext(
      <DinaForm initialValues={{}}>
        <MaterialSampleBreadCrumb
          materialSample={materialSampleWithHierarchy}
        />
      </DinaForm>
    );

    // It will have 3 items, the last one being the current sample.
    const breadcrumbItems = Array.from(
      container.querySelectorAll("li.breadcrumb-item")
    ).map((node) => node.textContent?.trim());
    expect(breadcrumbItems).toEqual(["B", "C"]);

    // It will have 3 links.
    const links = Array.from(container.querySelectorAll("a")).map((link) =>
      link.getAttribute("href")
    );
    expect(links).toEqual([
      "/collection/material-sample/view?id=A",
      "/collection/material-sample/view?id=B",
      "/collection/material-sample/view?id=C"
    ]);
  });
});
