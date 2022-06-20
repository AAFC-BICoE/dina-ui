import { PersistedResource } from "kitsu";
import { DinaForm } from "../../../../../common-ui/lib";
import { mountWithAppContext } from "../../../../test-util/mock-app-context";
import { MaterialSample } from "../../../../types/collection-api";
import { MaterialSampleBreadCrumb } from "../MaterialSampleBreadCrumb";

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
    const wrapper = mountWithAppContext(
      <DinaForm initialValues={{}}>
        <MaterialSampleBreadCrumb
          materialSample={materialSampleWithHierarchy}
          disableLastLink={true}
        />
      </DinaForm>
    );

    // The currently selected material sample.
    expect(wrapper.find("#wb-cont").text()).toEqual("A");

    // Under the title, should be all of the parents of this selected record.
    expect(
      wrapper.find("li.breadcrumb-item").map(node => node.text().trim())
    ).toEqual(["B", "C"]);

    /* It will have 2 links,  the 3th is plain text for current sample */
    expect(wrapper.find("a").map(node => node.prop("href"))).toEqual([
      "/collection/material-sample/view?id=B",
      "/collection/material-sample/view?id=C"
    ]);
  });

  it("Renders the breadcrumb path from the hierarchy, lastLink enabled", async () => {
    const wrapper = mountWithAppContext(
      <MaterialSampleBreadCrumb materialSample={materialSampleWithHierarchy} />
    );
    /* It will have 3 items , last one is current sample */
    expect(
      wrapper.find("li.breadcrumb-item").map(node => node.text().trim())
    ).toEqual(["B", "C"]);

    /* It will have 3 links */
    expect(wrapper.find("a").map(node => node.prop("href"))).toEqual([
      "/collection/material-sample/view?id=A",
      "/collection/material-sample/view?id=B",
      "/collection/material-sample/view?id=C"
    ]);
  });
});
