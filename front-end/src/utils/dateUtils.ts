import dayjs from "dayjs";

import { DATETIME_FORMAT, DATETIME_WITHOUT_YEAR_FORMAT } from "../constants";

export const formatDatetime = (timestamp: number) =>
  dayjs.unix(timestamp).format(DATETIME_FORMAT);

export const formatDate = (date: Date, format: string = DATETIME_FORMAT) => {
  const dayjsDate = dayjs(date);
  if (dayjsDate.year() < 1970) {
    return "-";
  }
  return dayjsDate.format(format);
};

export const formatDateWithoutYear = (date: Date) =>
  formatDate(date, DATETIME_WITHOUT_YEAR_FORMAT);
