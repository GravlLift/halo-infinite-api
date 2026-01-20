import { HaloInfiniteCalculatedClient } from "./";
import { SpartanTokenProvider } from "../token-providers/spartan-token-provider";
import { ResolvablePromise } from "../../util/resolvable-promise";

type QueryTest = Parameters<
  HaloInfiniteCalculatedClient["Academy"]["GetContent"]
>[0];
const queryTest: {
  clearanceId?: string | undefined;
} = {} as QueryTest;

type PathTest = Parameters<
  HaloInfiniteCalculatedClient["Economy"]["WeaponCoreCustomization"]
>[0];
const pathTest: {
  player: string;
  coreId: string;
} = {} as PathTest;

type ResultTest = ReturnType<
  HaloInfiniteCalculatedClient["Stats"]["GetMatchHistory"]
>;
const resultTest: ResultTest = {} as ResultTest;

describe("Halo Infinite Client", () => {
  it("should retry a request when 401", async () => {
    const clearStartedPromise = new ResolvablePromise<void>();
    const clearCompletedPromise = new ResolvablePromise<void>();
    const spartanTokenProvider: SpartanTokenProvider = {
      getSpartanToken: jest.fn().mockResolvedValue("expired"),
      clearSpartanToken: jest.fn().mockImplementationOnce(async () => {
        // Fake timeout to see if code skips ahead
        clearStartedPromise.resolve();
        await clearCompletedPromise;

        // Set next call to resolve
        jest
          .mocked(spartanTokenProvider.getSpartanToken)
          .mockResolvedValueOnce("valid");
        mockFetch.mockResolvedValueOnce({
          ok: true,
          status: 200,
          json: jest.fn(),
        });
      }),
      getCurrentExpiration: jest.fn().mockResolvedValueOnce(null),
    };
    const mockFetch = jest.fn().mockResolvedValueOnce({
      status: 401,
    });

    const client = new HaloInfiniteCalculatedClient(
      spartanTokenProvider,
      mockFetch,
    );
    const currentUserPromise = client.getCurrentUser();

    await clearStartedPromise;

    expect(mockFetch).toHaveBeenCalledTimes(1);

    // Proceed with failure handler
    clearCompletedPromise.resolve();

    await currentUserPromise;

    expect(
      mockFetch.mock.calls[1][1].headers.get("x-343-authorization-spartan"),
    ).toBe("valid");
  });

  it("should create a client", () => {
    const spartanTokenProvider = {} as SpartanTokenProvider;
    const fetchFn = jest.fn();
    const client = new HaloInfiniteCalculatedClient(
      spartanTokenProvider,
      fetchFn,
    );
  });
});
