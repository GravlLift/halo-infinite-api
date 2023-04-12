export interface XboxTicket {
  IssueInstant: string;
  NotAfter: string;
  Token: string;
  DisplayClaims: {
    xui: [
      {
        uhs: string;
        gtg: string;
        xid: string;
        agg: string;
        usr: string;
        utr: string;
        prv: string;
      }
    ];
  };
}
