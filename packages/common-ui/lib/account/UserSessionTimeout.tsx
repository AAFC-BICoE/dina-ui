import { DinaMessage } from "packages/dina-ui/intl/dina-ui-intl";
import React, { ReactNode, useState } from "react";
import { useIdleTimer } from "react-idle-timer";
import { AreYouSureModal, useAccount, useModal } from "..";

export function millisToMinutesAndSeconds(millis) {
  const minutes = Math.floor(millis / 60000);
  const seconds = ((millis % 60000) / 1000).toFixed(0);
  return { timeLeftMin: minutes, timeLeftSec: seconds };
}

export function UserSessionTimeout({ children }: { children: ReactNode }) {
  const { openModal } = useModal();
  const { logout } = useAccount();

  /* warning user 3 minutes before the actual timeout */
  const [timeLeft, setTimeLeft] = useState({ timeLeftMin: 3, timeLeftSec: 0 });

  const handleOnIdle = () => {
    const timeLeftMin = millisToMinutesAndSeconds(180000).timeLeftMin;
    const timeLeftSec = millisToMinutesAndSeconds(180000).timeLeftSec;

    setTimeLeft({ timeLeftMin, timeLeftSec: parseFloat(timeLeftSec) });

    if (!isNaN(timeLeftMin) && !isNaN(parseFloat(timeLeftSec))) {
      openModal(
        <AreYouSureModal
          actionMessage={<DinaMessage id="sessionTimeoutWarning" />}
          onYesButtonClicked={() => reset()}
          onNoButtonClicked={() => logout()}
          timeLeft={timeLeft}
          setTimeLeft={setTimeLeft}
        />
      );
    }
  };

  const { reset } = useIdleTimer({
    timeout: 10 * 1000,
    onIdle: handleOnIdle,
    debounce: 50
  });

  return <>{children}</>;
}
