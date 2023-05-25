import {
  DinaFormSection,
  filterBy,
  ResourceSelectField
} from "../../../../common-ui/lib";
import { ThermocyclerProfile } from "../../../../dina-ui/types/seqdb-api";
import styles from "./ThermocylerProfileWorksheetElement.module.css";

export function ThermocyclerProfileWorksheetElement({
  thermocyclerProfile
}: {
  thermocyclerProfile?: ThermocyclerProfile;
}) {
  const numToAppend = 12 - (thermocyclerProfile?.steps?.length || 0);
  const steps = thermocyclerProfile?.steps || [];
  for (let i = 0; i < numToAppend; i++) {
    steps.push("");
  }
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
          <div key={index} className={styles[`step${index + 1}`] + " mb-3"}>
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
