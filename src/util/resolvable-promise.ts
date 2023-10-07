export class ResolvablePromise<TReturn> extends Promise<TReturn> {
  isCompleted = false;
  readonly resolve: (value: TReturn | PromiseLike<TReturn>) => void;
  readonly reject: (reason?: unknown) => void;
  constructor() {
    let resolve!: (value: TReturn | PromiseLike<TReturn>) => void;
    let reject!: (reason?: unknown) => void;
    super((res, rej) => {
      resolve = res;
      reject = rej;
    });
    this.resolve = (v) => {
      this.isCompleted = true;
      return resolve(v);
    };
    this.reject = (r) => {
      this.isCompleted = true;
      return reject(r);
    };
  }

  // you can also use Symbol.species in order to
  // return a Promise for then/catch/finally
  static get [Symbol.species]() {
    return Promise;
  }

  // Promise overrides his Symbol.toStringTag
  get [Symbol.toStringTag]() {
    return "ResolvablePromise";
  }
}
