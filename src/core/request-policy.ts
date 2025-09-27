import { handleType, retry } from "cockatiel";
import { RequestError } from "../util/request-error";

export const unauthorizedRetryPolicy = retry(
  handleType(RequestError, (error) => error.response.status === 401),
  { maxAttempts: 2 }
);
