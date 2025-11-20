import { HaloInfiniteClient } from "./halo-infinite-client";
import { SpartanTokenProvider } from "./token-providers/spartan-token-provider";
import { ResolvablePromise } from "../util/resolvable-promise";
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

    const client = new HaloInfiniteClient(spartanTokenProvider, mockFetch);
    const currentUserPromise = client.getCurrentUser();

    await clearStartedPromise;

    expect(mockFetch).toHaveBeenCalledTimes(1);

    // Proceed with failure handler
    clearCompletedPromise.resolve();

    await currentUserPromise;

    expect(
      mockFetch.mock.calls[1][1].headers.get("x-343-authorization-spartan")
    ).toBe("valid");
  });
});
