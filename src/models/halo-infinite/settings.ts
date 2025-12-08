export interface Settings {
  Authorities: Record<
    string,
    {
      AuthorityId: string;
      Scheme: number;
      Hostname: string;
      Port: number;
      AuthenticationMethods: number[];
    }
  >;
  RetryPolicies: Record<
    string,
    {
      RetryPolicyId: string;
      TimeoutMs: number;
      RetryOptions: {
        MaxRetryCount: number;
        RetryDelayMs: number;
        RetryGrowth: number;
        RetryJitterMs: number;
        RetryIfNotFound: boolean;
      };
    }
  >;
  Settings: Record<string, string>;
  Endpoints: Record<
    string,
    {
      AuthorityId: keyof Settings["Authorities"];
      Path: string;
      QueryString: string;
      RetryPolicyId: keyof Settings["RetryPolicies"];
      TopicName: string;
      AcknowledgementTypeId: number;
      AuthenticationLifetimeExtensionSupported: boolean;
      ClearanceAware: boolean;
    }
  >;
}
