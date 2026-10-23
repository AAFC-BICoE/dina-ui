import { managementDefaults } from "../../../pages/feedback/home2";

describe("Home2 page", () => {
  it("Includes the Reindex Documents card for admins only.", () => {
    const reindexCard = (isAdmin: boolean) =>
      managementDefaults(isAdmin).find(
        (card) => card.id === "reindex-documents"
      );

    expect(reindexCard(true)?.href).toEqual("/admin/reindex");
    expect(reindexCard(false)).toBeUndefined();
  });
});
