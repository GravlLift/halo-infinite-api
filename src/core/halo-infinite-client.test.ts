import { HaloInfiniteClient } from "./halo-infinite-client";
import { SpartanTokenProvider } from "./token-providers/spartan-token-providers";
describe("Halo Infinite Client", () => {
  it("should retry a request when 401", async () => {
    const spartanTokenProvider: SpartanTokenProvider = {
      getSpartanToken: jest.fn().mockResolvedValue("expired"),
      clearSpartanToken: jest.fn().mockImplementationOnce(async () => {
        // Fake timeout to see if code skips ahead
        await new Promise((resolve) => setTimeout(resolve, 0));
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

    const client = new HaloInfiniteClient(
      spartanTokenProvider,
      jest.fn(),
      mockFetch
    );
    await client.getCurrentUser();

    expect(spartanTokenProvider.clearSpartanToken).toHaveBeenCalledTimes(1);
    expect(
      mockFetch.mock.calls[1][1].headers.get("x-343-authorization-spartan")
    ).toBe("valid");
  });
});
