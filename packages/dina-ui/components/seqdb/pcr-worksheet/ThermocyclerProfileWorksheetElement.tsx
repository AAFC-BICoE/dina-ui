import {
  DinaFormSection,
  filterBy,
  ResourceSelectField
} from "../../../../common-ui/lib";
import { ThermocyclerProfile } from "../../../../dina-ui/types/seqdb-api";
import classnames from "classnames";
import styles from "./ThermocylerProfileWorksheetElement.module.css";

function getGridAreaStyle(index: number, half: number) {
  let rowStart: number;
  let rowEnd: number;
  let colStart: number;
  let colEnd: number;
  if (index <= half) {
    rowStart = index;
    rowEnd = rowStart + 1;
    colStart = 1;
    colEnd = 2;
  } else {
    rowStart = index - half;
    rowEnd = rowStart + 1;
    colStart = 2;
    colEnd = 3;
  }
  return `${rowStart} / ${colStart} / ${rowEnd} / ${colEnd}`;
}

export function ThermocyclerProfileWorksheetElement({
  thermocyclerProfile
}: {
  thermocyclerProfile?: ThermocyclerProfile;
}) {
  const steps = thermocyclerProfile?.steps || [];
  const half = (steps.length + (steps.length % 2)) / 2;
  return (
    <>
      <DinaFormSection horizontal={[4, 8]}>
        <ResourceSelectField<ThermocyclerProfile>
          className="col-sm-12"
          name="thermocyclerProfile"
          filter={filterBy(["name"])}
          model="seqdb-api/thermocycler-profile"
          optionLabel={(profile) => profile.name}
          readOnlyLink="/seqdb/thermocycler-profile/view?id="
          isDisabled={true}
          placeholder=""
        />
      </DinaFormSection>
      <div className={styles["step-container"]}>
        {steps?.map((step, index) => (
          <div
            key={index}
            className={classnames(styles.step, "mb-3")}
            style={{ gridArea: getGridAreaStyle(index + 1, half) }}
          >
            <label>
              <strong>Step {index + 1}</strong>
            </label>
            <input
              type="text"
              className="form-control"
              disabled={true}
              value={step}
            />
          </div>
        ))}
      </div>
      <div className={styles["step-container"] + " mb-3"}>
        <div className={styles["cycles-container"]}>
          <label>
            <strong>Cycles</strong>
          </label>
          <input
            type="text"
            className="form-control"
            disabled={true}
            value={thermocyclerProfile?.cycles || ""}
          />
        </div>
      </div>
    </>
  );
}
