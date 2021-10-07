import { DinaMessage, useDinaIntl } from "../../../dina-ui/intl/dina-ui-intl";
import React, { ReactNode } from "react";
import { useIdleTimer } from "react-idle-timer";
import { AreYouSureModal, useAccount, useModal } from "..";
import { isNumber } from "lodash";
import { FormattedMessage } from "react-intl";

export function millisToMinutesAndSeconds(millis) {
  const minutes = Math.floor(millis / 60000);
  const seconds = ((millis % 60000) / 1000).toFixed(0);
  return { min: minutes, sec: parseFloat(seconds) };
}

export function UserSessionTimeout({ children }: { children: ReactNode }) {
  const { openModal } = useModal();
  const { logout } = useAccount();
  const { formatMessage } = useDinaIntl();

  /* warning user 3 minutes before the actual timeout */
  const timeLeft = millisToMinutesAndSeconds(180000);
  let timeRemain = timeLeft;
  let shouldSignIn = timeLeft && timeLeft.min === 0 && timeLeft.sec === 0;

  const messageBody = (
    <p style={{ fontSize: "x-large" }} id="sessionExpireWaring">
      <FormattedMessage id="sessionAboutToExpire" values={timeLeft} />{" "}
    </p>
  );

  const handleOnIdle = () => {
    if (isNumber(timeLeft.min) && isNumber(timeLeft.sec)) {
      const myInterval = setInterval(() => {
        /* caculate time remain in warning for counting down display */
        timeRemain = millisToMinutesAndSeconds(
          timeRemain?.min * 60000 + timeRemain?.sec * 1000 - 1000
        );
        shouldSignIn =
          timeRemain && timeRemain.min === 0 && timeRemain.sec === 0;

        const component = document.getElementById("sessionExpireWaring");
        const yesBtn = document?.querySelectorAll<any>(".yes-button");
        const noBtn = document?.querySelectorAll<any>(".no-button");

        if (component && yesBtn && noBtn) {
          if (shouldSignIn) {
            component.innerHTML = formatMessage("sessionExpiredMessage");
            /* Display signin button only, when countdown reaches zero */
            yesBtn?.forEach((element, _) => {
              element.style.display = "none";
            });
            noBtn?.forEach((element, _) => {
              element.innerHTML = formatMessage("signin");
            });
            clearInterval(myInterval);
          } else {
            component.innerHTML = formatMessage(
              "sessionAboutToExpire",
              timeRemain
            );
          }
        }
      }, 1000);

      openModal(
        <AreYouSureModal
          actionMessage={<DinaMessage id="sessionTimeoutWarning" />}
          onYesButtonClicked={() => (clearInterval(myInterval), reset())}
          onNoButtonClicked={() => (clearInterval(myInterval), logout())}
          messageBody={messageBody}
        />
      );
    }
  };

  const { reset } = useIdleTimer({
    /** 20 minutes minus 3 to start warning user of session timeout */
    timeout: 17 * 60 * 1000,
    onIdle: handleOnIdle,
    debounce: 500
  });

  return <>{children}</>;
}
