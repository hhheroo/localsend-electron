if (!Promise.withResolvers) {
  Promise.withResolvers = function <T>() {
    let resolve: (value: T | PromiseLike<T>) => void
    let reject: (reason?: any) => void

    const promise = new Promise<T>((_resolve, _reject) => {
      resolve = _resolve;
      reject = _reject;
    });

    // @ts-expect-error
    return { promise, resolve, reject };
  };
}
