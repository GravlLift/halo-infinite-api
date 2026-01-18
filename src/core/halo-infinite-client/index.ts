import { FetchFunction, defaultFetch } from "../../util/fetch-function";
import { SpartanTokenProvider } from "../token-providers/spartan-token-provider";
import { HaloInfiniteClientBase } from "./base";
import settings from "./settings";
import {
  Categories,
  CategoryEndpointDictionary,
  EndpointParameters,
  EndpointsInCategory,
} from "./utilities";

type CategoryMap<TCategoryKey extends Categories> = {
  [TEndpointKey in keyof EndpointsInCategory<TCategoryKey>]: (
    ...args: [
      ...(EndpointParameters<TCategoryKey, TEndpointKey> extends never
        ? []
        : [params: EndpointParameters<TCategoryKey, TEndpointKey>]),
      init?: Omit<RequestInit, "body" | "method">
    ]
  ) => Promise<any>;
};

type FunctionMap = {
  [TCategoryKey in Categories]: CategoryMap<TCategoryKey>;
};

interface PaginationContainer<TValue> {
  Start: number;
  Count: number;
  ResultCount: number;
  Results: TValue[];
}

export interface ResultContainer<TValue> {
  Id: string;
  ResultCode: 0 | 1;
  Result: TValue;
}

export interface ResultsContainer<TValue> {
  Value: ResultContainer<TValue>[];
}

export declare interface HaloInfiniteClient extends FunctionMap {}

export class HaloInfiniteClient extends HaloInfiniteClientBase {
  constructor(
    spartanTokenProvider: SpartanTokenProvider,
    fetchFn: FetchFunction = defaultFetch
  ) {
    super(spartanTokenProvider, fetchFn);
    return new Proxy(this, {
      get: <TCategory extends Categories>(
        target: HaloInfiniteClient,
        categoryKey: TCategory,
        receiver: any
      ) => {
        // Preserve normal members (methods, fields) if they exist
        if (categoryKey in target) {
          return Reflect.get(target, categoryKey, receiver);
        }

        // Return a proxy representing the category (endpoints)
        return new Proxy(
          {},
          {
            get: <TEndpoint extends keyof EndpointsInCategory<TCategory>>(
              _catTarget: {},
              endpointKey: TEndpoint
            ) => {
              // Endpoint function matching CategoryMap signature
              return async (
                ...args: [
                  ...(EndpointParameters<TCategory, TEndpoint> extends never
                    ? []
                    : [params: EndpointParameters<TCategory, TEndpoint>]),
                  init?: Omit<RequestInit, "body" | "method">
                ]
              ) => {
                const [paramsOrInit, maybeInit] = args as any[];
                const isInitOnly =
                  paramsOrInit &&
                  typeof paramsOrInit === "object" &&
                  ("headers" in paramsOrInit || "mode" in paramsOrInit);
                const params = isInitOnly
                  ? ({} as EndpointParameters<TCategory, TEndpoint>)
                  : paramsOrInit ?? {};
                const init = isInitOnly ? paramsOrInit : maybeInit;

                return this.executeDefaultRequest<TCategory, TEndpoint>(
                  categoryKey,
                  endpointKey,
                  params,
                  init
                );
              };
            },
          }
        );
      },
    });
  }

  private async executeDefaultRequest<
    TCategoryKey extends Categories & string,
    TEndpointKey extends keyof CategoryEndpointDictionary[TCategoryKey] & string
  >(
    category: TCategoryKey,
    endpoint: TEndpointKey,
    params: EndpointParameters<TCategoryKey, TEndpointKey>,
    init?: RequestInit
  ) {
    const endpointInfo =
      settings.Endpoints[
        `${category}_${endpoint}` as keyof typeof settings.Endpoints
      ];

    const path = endpointInfo.Path.replace(/{(.*?)}/g, (_match, p1) => {
      const key = p1 as keyof EndpointParameters<TCategoryKey, TEndpointKey>;
      if (key in params) {
        return encodeURIComponent(String(params[key]));
      } else {
        throw new Error(`Missing path parameter: ${p1}`);
      }
    });

    const query = endpointInfo.QueryString.replace(/{(.*?)}/g, (_match, p1) => {
      const key = p1 as keyof EndpointParameters<TCategoryKey, TEndpointKey>;
      if (key in params) {
        return encodeURIComponent(String(params[key]));
      } else {
        throw new Error(`Missing query parameter: ${p1}`);
      }
    });

    const authorityInfo = settings.Authorities[endpointInfo.AuthorityId];

    const url = `https://${authorityInfo.Hostname}${
      authorityInfo?.Port ? `:${authorityInfo.Port}` : ""
    }${path}${query ? `?${query}` : ""}`;

    return this.executeJsonRequest(url, init ?? {});
  }
}
