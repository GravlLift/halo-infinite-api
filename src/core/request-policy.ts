import { ConstantBackoff, handleWhen, retry } from "cockatiel";
import { RequestError } from "../util/request-error";

export const unauthorizedRetryPolicy = retry(
  handleWhen(
    (error) => error instanceof RequestError && error.response.status === 401
  ),
  { maxAttempts: 2, backoff: new ConstantBackoff(50) }
);
