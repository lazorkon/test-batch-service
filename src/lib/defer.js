class Defer {
  constructor() {
      this.promise = new Promise((resolve, reject) => {
          this._resolve = resolve;
          this._reject = reject;
      });
  }

  resolve(data) {
      this._resolve(data);
  }

  reject(err) {
      this._reject(err);
  }

  toPromise() {
      return this.promise;
  }

  then(onResolve, onReject) {
      return this.promise.then(onResolve, onReject);
  }

  catch(onReject) {
      return this.promise.catch(onReject);
  }
}

module.exports = {
  Defer,
};
