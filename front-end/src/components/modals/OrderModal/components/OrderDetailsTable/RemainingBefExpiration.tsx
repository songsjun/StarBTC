import dayjs from "dayjs";
import * as duration from 'dayjs/plugin/duration';
import moment from "moment";
import { FC, useState } from "react";
import { useInterval } from "react-use";
dayjs.extend(duration.default);

export const RemainingBefExpiration: FC<{
  width?: number;
  expirationDate: Date;
  isExpired: boolean;
}> = ({ width, expirationDate, isExpired }) => {
  const [remaining, setRemaining] = useState<string>(undefined);

  useInterval(() => {
    if (isExpired)
      setRemaining("Expired");
    else {
      const diff = dayjs(expirationDate).diff(dayjs());
      const duration = dayjs.duration(diff);
      let days = Math.floor(duration.asDays());
      const formattedDuration = moment.utc(diff).format("HH:mm:ss");
      let daysText = days + " day" + (days === 1 ? ", " : "s, ");

      setRemaining(days > 0 ? `${daysText} ${formattedDuration}` : formattedDuration);
    }
  }, 1000);

  if (!remaining)
    return null;

  return (
    <span style={{ opacity: 0.5, ...(width && { width: `${width}px` }) }}>
      {remaining}
    </span>
  )
}