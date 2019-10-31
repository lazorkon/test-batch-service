const fetch = require('node-fetch');
const { Defer } = require('./defer');

const debug = true;

const defsults = {
  maxPending: 1,
  maxRetryCount: 1,

  // todo: implement rate limit
};

class JobQueue {

  constructor({ maxPending, maxRetryCount } = defsults) {
    this.done = new Defer();
    this.pending = 0;
    this.maxPending = maxPending;
    this.maxRetryCount = maxRetryCount;
    this.queue = [];
    this.counter = 0;
    this.resultData = [];
  }

  getResultCode() {
    if (this.queue.length) {
      throw new Error('Can not get status, queue is not empty');
    }
    const ok = this.resultData.every((res) => res.ok);
    // todo: how to calc error code
    return ok ? 200 : 500;
  }

  getResultData() {
    if (this.queue.length) {
      throw new Error('Can not get result, queue is not empty');
    }
    return this.resultData;
  }

  add(reqInfo) {
    const idx = this.counter++;
    return new Promise((resolve, reject) => {
      const handler = () => makeRequest(reqInfo);
      this.queue.push({
        idx,
        handler,
        resolve,
        reject,
        retryCount: 0,
      });
    });
  }

  run() {
    this.next();
    return this.done.toPromise();
  }

  next() {
    try {
      if (!this.queue.length) {
        debug && console.log('-- queue.next empty queue');
        this.done.resolve(this.resultData);
        return;
      }
      if (this.pending >= this.maxPending) {
        debug && console.log('-- queue.next concurency block');
        return;
      }
      const item = this.queue.shift();
      if (!item) {
        debug && console.log('-- queue.next empty item');
        return;
      }

      debug && console.log('-- queue.next');
      this.pending++;

      Promise.resolve(item.handler())
        .then((value) => {
          --this.pending;
          debug && console.log('-- req done', item.idx, value);
          this.resultData[item.idx] = value;
          item.resolve(value);
          this.next();
        })
        .catch((err) => {
          --this.pending;
          debug && console.error('-- req fail', item.idx, err);
          this.resultData[item.idx] = err;

          if (item.retryCount < this.maxRetryCount) {
            debug && console.log('-- queue.next retry', item.idx);
            ++item.retryCount;
            this.queue.push(item);
          } else {
            item.reject(err);
          }
          this.next();
        });
    } catch (err) {
      debug && console.error('-- item err', item.idx, err);
      --this.pending;
      item.reject(err);
      this.next();
    }

    return;
  }
}

function makeRequest(reqInfo) {
  console.log('-- make request', reqInfo);
  let tmpRes;
  const reqData = {
    method: reqInfo.verb,
  };
  if (reqInfo.body) {
    reqData.body = JSON.stringify(reqInfo.body);
  }
  if (reqInfo.headers) {
    reqData.headers = reqInfo.headers;
    // todo: use original or default headers
    // headers: { 'Content-Type': 'application/json' },
  }
  return fetch(reqInfo.url, reqData)
    .then((res) => {
      tmpRes = res;
      return res.text();
    })
    .then((value) => {
      const ok = tmpRes.ok;
      const code = tmpRes.status;
      return { ok, code, error: undefined, value };
    })
    .catch((error) => {
      const ok = false;
      return { ok, code: 0, error, value: undefined };
    });
}

module.exports = {
  JobQueue,
};
