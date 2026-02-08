export interface PopCryptoProvider {
  // Public proof key object (e.g., JWK) to include when needed by request bodies
  proofKey: unknown;
  // Signs the given payload bytes and returns signature bytes
  sign(payload: Uint8Array): Promise<Uint8Array> | Uint8Array;
}

export interface IXboxRequestSigner {
  readonly proofKey: unknown;
  signRequest(reqUri: string, token: string, body: string): Promise<string>;
}

/**
 * Replicates XboxAuthNet.XboxLive.Crypto.XboxRequestSigner behavior.
 * Builds the payload per spec and returns the base64 signature header value.
 */
export class XboxRequestSigner implements IXboxRequestSigner {
  constructor(private readonly signer: PopCryptoProvider) {}

  public get proofKey() {
    return this.signer.proofKey;
  }

  public async signRequest(
    reqUri: string,
    token: string,
    body: string,
  ): Promise<string> {
    const timestamp = this.getWindowsTimestamp();
    const data = this.generatePayload(timestamp, reqUri, token, body);
    const signatureBytes = await this.sign(timestamp, data);
    return this.toBase64(signatureBytes);
  }

  private generatePayload(
    windowsTimestamp: bigint,
    uri: string,
    token: string,
    payload: string,
  ): Uint8Array {
    const pathAndQuery = new URL(uri).pathname + new URL(uri).search;

    // Calculate allocation size per C# implementation
    const allocSize =
      4 +
      1 + // policyVersion + separator
      8 +
      1 + // windowsTimestamp + separator
      // strings section below (POST + path/query + token + payload)
      4 +
      1 + // "POST\0"
      this.byteLengthAscii(pathAndQuery) +
      1 +
      this.byteLengthAscii(token) +
      1 +
      this.byteLengthAscii(payload) +
      1;

    const bytes = new Uint8Array(allocSize);

    // policyVersion: int32 big-endian value 1 at offset 0
    const policyVersion = new Uint8Array(4);
    this.writeInt32BE(policyVersion, 0, 1);
    bytes.set(policyVersion, 0);

    // windowsTimestamp: uint64 big-endian at offset 5 (after a separator at offset 4)
    const windowsTsBytes = new Uint8Array(8);
    this.writeUint64BE(windowsTsBytes, 0, windowsTimestamp);
    bytes.set(windowsTsBytes, 5);

    // Strings content start at offset 14
    let offset = 14;
    offset = this.writeAscii(bytes, offset, "POST");
    bytes[offset++] = 0; // null separator
    offset = this.writeAscii(bytes, offset, pathAndQuery);
    bytes[offset++] = 0;
    offset = this.writeAscii(bytes, offset, token);
    bytes[offset++] = 0;
    offset = this.writeAscii(bytes, offset, payload);
    bytes[offset++] = 0;

    return bytes;
  }

  private async sign(
    windowsTimestamp: bigint,
    payload: Uint8Array,
  ): Promise<Uint8Array> {
    const sig = await this.signer.sign(payload);

    // Build header: policyVersion (int32 BE 1) + windowsTimestamp (uint64 BE) + signature
    const header = new Uint8Array(sig.length + 12);

    const policyVersion = new Uint8Array(4);
    this.writeInt32BE(policyVersion, 0, 1);
    header.set(policyVersion, 0);

    const windowsTsBytes = new Uint8Array(8);
    this.writeUint64BE(windowsTsBytes, 0, windowsTimestamp);
    header.set(windowsTsBytes, 4);

    header.set(sig, 12);

    return header;
  }

  private toBase64(bytes: Uint8Array): string {
    if (typeof Buffer !== "undefined") {
      return Buffer.from(bytes).toString("base64");
    }
    // Browser-friendly polyfill
    let binary = "";
    const chunkSize = 0x8000;
    for (let i = 0; i < bytes.length; i += chunkSize) {
      const chunk = bytes.subarray(i, i + chunkSize);
      binary += String.fromCharCode.apply(
        null,
        Array.from(chunk) as unknown as number[],
      );
    }
    return btoa(binary);
  }

  private getWindowsTimestamp(): bigint {
    const unixSeconds = BigInt(Math.floor(Date.now() / 1000));
    const windowsTimestamp =
      (unixSeconds + BigInt(11644473600)) * BigInt(10000000);
    return windowsTimestamp;
  }

  private byteLengthAscii(str: string): number {
    return new TextEncoder().encode(str).length; // UTF-8 length; ASCII subset has same length
  }

  private writeAscii(target: Uint8Array, offset: number, str: string): number {
    const bytes = new TextEncoder().encode(str);
    target.set(bytes, offset);
    return offset + bytes.length;
  }

  private writeInt32BE(
    buffer: Uint8Array,
    offset: number,
    value: number,
  ): void {
    buffer[offset] = (value >>> 24) & 0xff;
    buffer[offset + 1] = (value >>> 16) & 0xff;
    buffer[offset + 2] = (value >>> 8) & 0xff;
    buffer[offset + 3] = value & 0xff;
  }

  private writeUint64BE(
    buffer: Uint8Array,
    offset: number,
    value: bigint,
  ): void {
    // Write as big-endian 64-bit unsigned
    for (let i = 0; i < 8; i++) {
      const shift = BigInt(8 * (7 - i));
      buffer[offset + i] = Number((value >> shift) & BigInt(0xff));
    }
  }
}
