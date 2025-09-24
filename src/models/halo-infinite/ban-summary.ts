import { ResultContainer } from "../../core/halo-infinite-client.js";
import { ApiFormattedDate } from "./api-formatted-date.js";

export interface BanSummary {
  Results: ResultContainer<{
    BansInEffect: [
      {
        Type: number;
        Scope: number;
        MessageId: unknown;
        MessageUri: unknown;
        EnforceUntilUtc: ApiFormattedDate;
        BanMessagePath: string;
      }
    ];
  }>[];
  Links: {
    Self: {
      AuthorityId: string;
      Path: string;
      QueryString: string;
      RetryPolicyId: string;
      TopicName: string;
      AcknowledgementTypeId: number;
      AuthenticationLifetimeExtensionSupported: boolean;
      ClearanceAware: boolean;
    };
  };
}
