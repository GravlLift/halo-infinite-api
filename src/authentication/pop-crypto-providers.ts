export type SignFn = (payload: Uint8Array) => Promise<Uint8Array> | Uint8Array;

export class GenericPopCryptoProvider {
  constructor(
    private readonly _proofKey: unknown,
    private readonly _sign: SignFn,
  ) {}

  get proofKey(): unknown {
    return this._proofKey;
  }

  sign(payload: Uint8Array): Promise<Uint8Array> | Uint8Array {
    return this._sign(payload);
  }
}

/**
 * WebCrypto-based PoP provider that signs using a provided SubtleCrypto and private key.
 * Works in browsers and in environments exposing `crypto.subtle`.
 */
export class WebCryptoPopCryptoProvider {
  constructor(
    private readonly subtle: SubtleCrypto,
    private readonly privateKey: CryptoKey,
    private readonly algorithm: AlgorithmIdentifier, // e.g. { name: 'ECDSA', hash: 'SHA-256' }
    private readonly _proofKey: unknown, // typically the public JWK
  ) {}

  get proofKey(): unknown {
    return this._proofKey;
  }

  async sign(payload: Uint8Array): Promise<Uint8Array> {
    const sig = await this.subtle.sign(
      this.algorithm,
      this.privateKey,
      payload,
    );
    return new Uint8Array(sig);
  }
}
