import React, { ReactNode, useState } from "react";
import { DinaForm, DinaFormSubmitParams } from "../formik-connected/DinaForm";
import { FormikButton } from "../formik-connected/FormikButton";
import { OnFormikSubmit } from "../formik-connected/safeSubmit";
import { SubmitButton } from "../formik-connected/SubmitButton";
import { CommonMessage } from "../intl/common-ui-intl";
import { useModal } from "./modal";
import { pick } from "lodash";
import { FormattedMessage } from "react-intl";
import { millisToMinutesAndSeconds } from "../account/UserSessionTimeout";
import { useDinaIntl } from "../../../dina-ui/intl/dina-ui-intl";

export interface AreYouSureModalProps {
  /** Describes the acion you're asking the user about. */
  actionMessage: ReactNode;

  onYesButtonClicked: OnFormikSubmit;

  /** Describes the message displaying to the user in order to make action decision. */
  messageBody?: ReactNode;

  onNoButtonClicked?: () => void;

  /** number of seconds and minutes left before timeout */
  timeLeft?: { timeLeftMin; timeLeftSec };

  setTimeLeft?: React.Dispatch<React.SetStateAction<any>>;
}

export function AreYouSureModal({
  actionMessage,
  messageBody,
  onYesButtonClicked,
  onNoButtonClicked,
  timeLeft
}: AreYouSureModalProps) {
  const { closeModal } = useModal();
  const { formatMessage } = useDinaIntl();
  const [shouldSignIn, setShouldSignIn] = useState(
    timeLeft &&
      timeLeft.timeLeftMin === 0 &&
      parseFloat(timeLeft.timeLeftSec) === 0
  );

  async function onYesClickInternal(
    dinaFormSubmitParams: DinaFormSubmitParams<any>
  ) {
    const yesBtnParam = pick(dinaFormSubmitParams, "submittedValues", "formik");
    await onYesButtonClicked(yesBtnParam.submittedValues, yesBtnParam.formik);
    closeModal();
  }

  let timeRemain = timeLeft;
  const myInterval = setInterval(() => {
    if (shouldSignIn) {
      clearInterval(myInterval);
    }
    timeRemain = millisToMinutesAndSeconds(
      timeRemain?.timeLeftMin * 60000 +
        parseFloat(timeRemain?.timeLeftSec) * 1000 -
        1000
    );
    const myShouldSignIn =
      timeRemain &&
      timeRemain.timeLeftMin === 0 &&
      parseFloat(timeRemain.timeLeftSec) === 0;
    const component = document.getElementById("sessionExpireWaring");

    if (component) {
      if (myShouldSignIn || shouldSignIn) {
        component.innerHTML = formatMessage("sessionExpiredMessage");
        setShouldSignIn?.(true);
        clearInterval(myInterval);
      } else {
        component.innerHTML = formatMessage("sessionAboutToExpire", timeRemain);
      }
    }
  }, 1000);

  return (
    <div className="modal-content">
      <div className="modal-header">
        <h1 style={{ border: "none" }}>{actionMessage}</h1>
      </div>
      <div className="modal-body">
        <DinaForm initialValues={{}} onSubmit={onYesClickInternal}>
          <main>
            {messageBody ?? timeLeft ? (
              <p style={{ fontSize: "x-large" }} id="sessionExpireWaring">
                <FormattedMessage
                  id="sessionAboutToExpire"
                  values={{
                    timeLeftMin: timeLeft?.timeLeftMin,
                    timeLeftSec: timeLeft?.timeLeftSec
                  }}
                />
              </p>
            ) : (
              <p style={{ fontSize: "x-large" }}>
                <CommonMessage id="areYouSure" />
              </p>
            )}
          </main>
          <div className="row">
            {!shouldSignIn ? (
              <div className="col-md-3">
                <SubmitButton className="form-control yes-button">
                  <CommonMessage id="yes" />
                </SubmitButton>
              </div>
            ) : null}
            <div className="offset-md-6 col-md-3">
              <FormikButton
                className="btn btn-dark form-control no-button"
                onClick={() =>
                  onNoButtonClicked
                    ? (onNoButtonClicked(), closeModal())
                    : closeModal()
                }
              >
                {shouldSignIn ? (
                  <CommonMessage id="signin" />
                ) : (
                  <CommonMessage id="no" />
                )}
              </FormikButton>
            </div>
          </div>
        </DinaForm>
      </div>
    </div>
  );
}
