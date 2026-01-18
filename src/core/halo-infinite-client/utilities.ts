import settings from "./settings";

type Endpoints = (typeof settings)["Endpoints"];
type ExceptLast<S extends string> = S extends `${infer Head}_${infer Tail}`
  ? Tail extends `${string}_${string}`
    ? `${Head}_${ExceptLast<Tail>}`
    : Head
  : "";
export type Categories = ExceptLast<keyof (typeof settings)["Endpoints"]>;
export type EndpointsInCategory<TCategory extends Categories> = {
  [TKey in keyof Endpoints as TKey extends `${TCategory}_${infer Endpoint}`
    ? Endpoint
    : never]: Endpoints[TKey];
};

export type CategoryEndpointDictionary = {
  [TCategoryKey in Categories]: {
    [TEndpointKey in keyof EndpointsInCategory<TCategoryKey>]?: EndpointsInCategory<TCategoryKey>[TEndpointKey];
  };
};

type EndpointPath<
  TCategory extends Categories,
  TEndpoint extends keyof CategoryEndpointDictionary[TCategory]
> = "Path" extends keyof NonNullable<
  CategoryEndpointDictionary[TCategory][TEndpoint]
>
  ? NonNullable<CategoryEndpointDictionary[TCategory][TEndpoint]>["Path"]
  : never;

type EndpointQueryString<
  TCategory extends Categories,
  TEndpoint extends keyof CategoryEndpointDictionary[TCategory]
> = "QueryString" extends keyof NonNullable<
  CategoryEndpointDictionary[TCategory][TEndpoint]
>
  ? NonNullable<CategoryEndpointDictionary[TCategory][TEndpoint]>["QueryString"]
  : never;

type ExtractTemplateKeys<TPath extends string> =
  TPath extends `${string}{${infer TKey}}${infer TRest}`
    ? TKey | ExtractTemplateKeys<TRest>
    : never;

export type QueryParams<
  TCategory extends Categories,
  TEndpoint extends keyof CategoryEndpointDictionary[TCategory]
> = EndpointQueryString<TCategory, TEndpoint> extends string
  ? {
      [TKey in ExtractTemplateKeys<
        EndpointQueryString<TCategory, TEndpoint>
      >]?: string;
    }
  : {};

export type PathParams<
  TCategory extends Categories,
  TEndpoint extends keyof CategoryEndpointDictionary[TCategory]
> = EndpointPath<TCategory, TEndpoint> extends string
  ? {
      [TKey in ExtractTemplateKeys<EndpointPath<TCategory, TEndpoint>>]: any;
    }
  : {};

export type EndpointParameters<
  TCategory extends Categories,
  TEndpoint extends keyof CategoryEndpointDictionary[TCategory]
> = PathParams<TCategory, TEndpoint> & QueryParams<TCategory, TEndpoint>;
