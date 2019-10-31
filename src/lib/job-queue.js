const fetch = require('node-fetch');
const { Defer } = require('./defer');

const debug = !!process.env.DEBUG;

/**
 * @typedef {Object} JobResult
 * @property {Boolean} ok
 * @property {Number} code - http status code
 * @property {Object|String} [value] - value returned by request, JSON or text
 * @property {*} [error]
 *
 */

const defaults = {
  maxPending: 1,
  maxRetryCount: 1,

  // todo: implement rate limit
};

class JobQueue {

  constructor({ maxPending, maxRetryCount } = defaults) {
    /**
     *
     */
    this.done = new Defer();
    /**
     * Count of running requests
     * @private
     */
    this.pending = 0;
    /**
     * Max number of parallel requests
     * @private
     */
    this.maxPending = maxPending;
    /**
     * Max count of retries for failed job
     * Note: failed jobs are added to and of queue
     * @private
     */
    this.maxRetryCount = maxRetryCount;
    /**
     * Queue of request data, mutates
     * @type <Array.<RequestInfo>>
     * @private
     */
    this.queue = [];
    /**
     * Counter track sequntial index of jobs
     * @private
     */
    this.counter = 0;
    /**
     * Results for each job, indexes match job indexes
     * @private
     * @type <Array.<JobResult>>
     */
    this.resultData = [];
  }

  /**
   * Returns combined HTTP status code, 200 by default
   * @returns {Number}
   */
  getResultCode() {
    if (this.queue.length) {
      throw new Error('Can not get status, queue is not empty');
    }
    const ok = this.resultData.every((res) => res.ok);
    // todo: how to calc error code
    return ok ? 200 : 500;
  }

  /**
   * Returns combined result as array,
   * result indexes are defined by initial job index in queue
   * @returns {Array.<JobResult>}
   */
  getResultData() {
    if (this.queue.length) {
      throw new Error('Can not get result, queue is not empty');
    }
    return this.resultData;
  }

  /**
   * Returns promise that will be resolved when this job is finished
   * @param {RequestInfo} reqInfo
   * @readonly {Promise}
   */
  add(reqInfo) {
    const idx = this.counter++;
    return new Promise((resolve, reject) => {
      const handler = () => this.makeRequest(reqInfo);
      this.queue.push({
        idx,
        handler,
        resolve,
        reject,
        retryCount: 0,
      });
    });
  }

  /**
   * Stars jobs procesing
   * Retuns promise that will be resolved when all jobs are finished
   * @returns {Array.<JobResult>}
   */
  run() {
    this.next();
    return this.done.toPromise();
  }

  /**
   * @private
   */
  next() {
    try {
      if (!this.queue.length) {
        debug && console.log('-- queue.next done');
        this.done.resolve(this.resultData);
        return;
      }
      if (this.pending >= this.maxPending) {
        debug && console.log('-- queue.next concurency limit');
        return;
      }
      const item = this.queue.shift();
      if (!item) {
        debug && console.log('-- queue.next empty item');
        return;
      }

      debug && console.log(`-- queue.next; idx: ${item.idx}; left: ${this.pending}`);
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
          this.retryJob(item, err);
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

  /**
   * @private
   * @param {object} item - queue item
   */
  retryJob(item) {
    if (item.retryCount < this.maxRetryCount) {
      debug && console.log('-- queue.next retry', item.idx);
      ++item.retryCount;
      this.queue.push(item);
    } else {
      item.reject(err);
    }
  }

  /**
   * @param {RequestInfo} reqInfo
   * @returns {Promise.<JobResult>}
   */
  makeRequest(reqInfo) {
    debug && console.log('-- make request', reqInfo);
    const verb = reqInfo.verb.toUpperCase();
    let tmpRes;
    const reqData = {
      method: verb,
    };
    if (reqInfo.body && verb !== 'GET' && verb !== 'HEAD') {
      reqData.body = JSON.stringify(reqInfo.body);
    }
    if (reqInfo.headers) {
      reqData.headers = reqInfo.headers;
    }

    return fetch(reqInfo.url, reqData)
      .then((res) => {
        tmpRes = res;
        const contentType = res.headers.get('content-type');
        const isJSON = contentType && String(contentType).includes('application/json')
        return isJSON ? res.json() : res.text();
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
}


module.exports = {
  JobQueue,
};
