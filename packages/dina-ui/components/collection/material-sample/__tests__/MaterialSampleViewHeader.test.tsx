import { DinaForm, mountWithAppContext } from "common-ui";
import "@testing-library/jest-dom";
import { MaterialSampleViewHeader } from "../MaterialSampleViewHeader";
import { MaterialSampleSummaryList } from "../MaterialSampleSummaryList";
import { MaterialSampleRestrictionsAlert } from "../MaterialSampleRestrictionsAlert";

const mockGet = jest.fn<any, any>(async () => ({ data: [] }));
const testCtx = { apiContext: { apiClient: { get: mockGet } } } as any;

const sample: any = {
  id: "A",
  type: "material-sample",
  group: "aafc",
  materialSampleName: "TEST-SAMPLE",
  parentMaterialSample: { id: "P", type: "material-sample" },
  hierarchy: [
    { uuid: "A", name: "TEST-SAMPLE" },
    { uuid: "P", name: "TEST-PARENT" },
    { uuid: "G", name: "TEST-GRANDPARENT" }
  ],
  organism: [
    {
      determination: [
        { isPrimary: true, scientificName: "Danaus plexippus" },
        { isPrimary: false, scientificName: "Other name" }
      ]
    }
  ],
  collection: { id: "c1", name: "Insects", code: "INS" },
  publiclyReleasable: false,
  notPubliclyReleasableReason: "Pending permit review"
};

describe("MaterialSampleViewHeader", () => {
  it("Renders parent, name, determination, counts, collection and release status", () => {
    const { container, getByText } = mountWithAppContext(
      <MaterialSampleViewHeader materialSample={sample} />,
      testCtx
    );

    expect(container.querySelector("#wb-cont")?.textContent).toEqual(
      "TEST-SAMPLE"
    );
    // Only the direct parent is linked, not the whole ancestor path.
    expect(getByText("TEST-PARENT").getAttribute("href")).toEqual(
      "/collection/material-sample/view?id=P"
    );
    expect(container.textContent).not.toContain("TEST-GRANDPARENT");
    expect(getByText("Danaus plexippus")).toBeInTheDocument();
    expect(container.textContent).toMatch(/1 organism · 2 determinations/);
    expect(getByText("Insects (INS)").getAttribute("href")).toEqual(
      "/collection/collection/view?id=c1"
    );
    expect(getByText("Not Publicly Releasable")).toBeInTheDocument();
    expect(getByText("Pending permit review")).toBeInTheDocument();
  });

  it("Hides the parent and release warning when not applicable", () => {
    const { queryByText } = mountWithAppContext(
      <MaterialSampleViewHeader
        materialSample={{
          ...sample,
          parentMaterialSample: undefined,
          publiclyReleasable: true
        }}
      />,
      testCtx
    );

    expect(queryByText("TEST-PARENT")).not.toBeInTheDocument();
    expect(queryByText("Not Publicly Releasable")).not.toBeInTheDocument();
  });
});

describe("MaterialSampleSummaryList", () => {
  const transactionElasticQuery = {
    response: {
      data: {
        hits: {
          total: { value: 3 },
          hits: [
            {
              _source: {
                data: {
                  id: "t1",
                  attributes: {
                    materialDirection: "OUT",
                    transactionNumber: "T-001"
                  }
                }
              }
            }
          ]
        }
      }
    }
  };

  it("Renders a row per non-empty value with links and counts", () => {
    const { getByText, container } = mountWithAppContext(
      <DinaForm
        initialValues={{
          projects: [
            { id: "p1", name: "Project 1" },
            { id: "p2", name: "Project 2" }
          ],
          assemblages: [{ id: "as1", name: "Assemblage 1" }],
          tags: ["needs-imaging", "dna-extracted"]
        }}
        readOnly={true}
      >
        <MaterialSampleSummaryList
          transactionElasticQuery={transactionElasticQuery}
        />
      </DinaForm>,
      testCtx
    );

    expect(getByText("Project 2").getAttribute("href")).toEqual(
      "/collection/project/view?id=p2"
    );
    expect(getByText("Assemblage 1").getAttribute("href")).toEqual(
      "/collection/assemblage/view?id=as1"
    );
    expect(getByText("needs-imaging")).toBeInTheDocument();
    expect(getByText("T-001").getAttribute("href")).toEqual(
      "/loan-transaction/transaction/view?id=t1"
    );
    expect(container.querySelectorAll(".list-group-item")).toHaveLength(4);
  });

  it("Renders nothing when every row is empty", () => {
    const { container } = mountWithAppContext(
      <DinaForm initialValues={{}} readOnly={true}>
        <MaterialSampleSummaryList transactionElasticQuery={undefined} />
      </DinaForm>,
      testCtx
    );

    expect(
      container.querySelector(".material-sample-summary-list")
    ).not.toBeInTheDocument();
  });
});

describe("MaterialSampleRestrictionsAlert", () => {
  const remarks = "TEST Restricted: permit required before any loan or export.";
  const biosafety = {
    phac_animal_rg: { risk_group: "Risk Group 2 (RG2)" }
  };

  function renderAlert(initialValues: any) {
    return mountWithAppContext(
      <DinaForm initialValues={initialValues} readOnly={true}>
        <MaterialSampleRestrictionsAlert />
      </DinaForm>,
      testCtx
    );
  }

  it("Shows the remarks and a line per biosafety level", () => {
    const { container, getByText } = renderAlert({
      restrictionRemarks: remarks,
      restrictionFieldsExtension: biosafety
    });
    expect(getByText("Restrictions")).toBeInTheDocument();
    expect(getByText(remarks)).toBeInTheDocument();
    expect(getByText("PHAC Animal RG Level")).toBeInTheDocument();
    expect(container.textContent).toContain("PHAC Animal RG Level RG2");
  });

  it("Shows only the remarks when there is no biosafety level", () => {
    const { getByText, queryByText } = renderAlert({
      restrictionRemarks: remarks,
      restrictionFieldsExtension: {}
    });
    expect(getByText(remarks)).toBeInTheDocument();
    expect(queryByText("PHAC Animal RG Level")).not.toBeInTheDocument();
  });

  it("Shows only the biosafety level when there are no remarks", () => {
    const { container } = renderAlert({
      restrictionFieldsExtension: biosafety
    });
    expect(container.textContent).toContain("PHAC Animal RG Level RG2");
    expect(container.textContent).not.toContain(remarks);
  });

  it("Renders nothing without remarks or biosafety levels", () => {
    const { container } = renderAlert({ restrictionFieldsExtension: {} });
    expect(
      container.querySelector(".material-sample-restrictions-alert")
    ).not.toBeInTheDocument();
  });
});
