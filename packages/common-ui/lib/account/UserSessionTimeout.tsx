import { DinaMessage } from "../../../dina-ui/intl/dina-ui-intl";
import React, { ReactNode, useState } from "react";
import { useIdleTimer } from "react-idle-timer";
import { AreYouSureModal, useAccount, useModal } from "..";

export function millisToMinutesAndSeconds(millis) {
  const minutes = Math.floor(millis / 60000);
  const seconds = ((millis % 60000) / 1000).toFixed(0);
  return { min: minutes, sec: parseFloat(seconds) };
}

export function UserSessionTimeout({ children }: { children: ReactNode }) {
  const { openModal } = useModal();
  const { logout } = useAccount();

  const handleOnIdle = () => {
    /* warning user 3 minutes before the actual timeout */
    const timeLeft = millisToMinutesAndSeconds(180000);

    if (!isNaN(timeLeft.min) && !isNaN(timeLeft.sec)) {
      openModal(
        <AreYouSureModal
          actionMessage={<DinaMessage id="sessionTimeoutWarning" />}
          onYesButtonClicked={() => reset()}
          onNoButtonClicked={() => logout()}
          timeLeft={timeLeft}
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
