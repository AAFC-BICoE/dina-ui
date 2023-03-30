import {
  Protocol,
  ProtocolData,
  ProtocolDataUnitEnum
} from "../../../../dina-ui/types/collection-api";
import { convertNumber } from "../../workbook/utils/workbookMappingUtils";

export function ReactionInputs({ protocol }: { protocol?: Protocol }) {
  let reactionMixVolumePerTube: number | undefined;
  if (protocol?.protocolData) {
    for (const pd of protocol.protocolData) {
      populateReactionMixVolumePerTube(pd);
    }
  }

  function populateReactionMixVolumePerTube(pd: ProtocolData) {
    if (
      reactionMixVolumePerTube === undefined &&
      pd.key === "reaction_mix_volume_per_tube"
    ) {
      const totalReactionMixVolumes = pd.protocolDataElement?.filter(
        (pde) =>
          pde.elementType === "quantity" && pde.unit === ProtocolDataUnitEnum.UL
      );
      if (totalReactionMixVolumes) {
        reactionMixVolumePerTube =
          convertNumber(totalReactionMixVolumes[0]?.value) || 0;
      }
    }
  }

  return (
    <>
      <div className="row">
        <div className="col-sm-2 mb-3">
          <input
            type="text"
            className="form-control"
            disabled={true}
            value={reactionMixVolumePerTube}
          />
        </div>
        <label className="col-sm-10 mb-3">
          <strong>ul reaction mix pipetted into each PCR tube</strong>
        </label>
      </div>
      <div className="row">
        <div className="col-sm-2 mb-3">
          <input
            type="text"
            className="form-control"
            disabled={true}
            value={1}
          />
        </div>
        <label className="col-sm-10 mb-3">
          <strong>ul of T-DNA added to each specific tube</strong>
        </label>
      </div>
      <div className="row">
        <div className="col-sm-2 mb-3">
          <input
            type="text"
            className="form-control"
            disabled={true}
            value={1}
          />
        </div>
        <label className="col-sm-10 mb-3">
          <strong>ul positive control added to +ve control tube</strong>
        </label>
      </div>
      <div className="row">
        <div className="col-sm-2 mb-3">
          <input
            type="text"
            className="form-control"
            disabled={true}
            value={1}
          />
        </div>
        <label className="col-sm-10 mb-3">
          <strong>ul negative control added to -ve control tube</strong>
        </label>
      </div>
    </>
  );
}
