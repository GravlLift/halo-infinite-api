import { DateTime } from "luxon";

export function coalesceDateTime(maybeDateTime: unknown) {
  if (DateTime.isDateTime(maybeDateTime)) {
    return maybeDateTime;
  } else if (maybeDateTime instanceof Date) {
    return DateTime.fromJSDate(maybeDateTime);
  } else if (typeof maybeDateTime === "string") {
    return DateTime.fromISO(maybeDateTime);
  }
  return undefined;
}
