const { getRequestInerator } = require('./request-template');
const { JobQueue } = require('./job-queue');

const debug = !!process.env.DEBUG;

// todo: validate request with joi
/**
 * Controller allows to perform multiple request at once in series.
 *
 * Expected method: POST
 * Expected body:
 * <code>
 * {
 *     template: {
 *         // http method
 *         verb: "PUT",
 *         // url template, params should contain values for all placeholders
 *         url: "https://jsonplaceholder.typicode.com/users/{userId}​"
 *     },
 *
 *     // "targets" defines number all requests;
 *     // is some of "params", "query", "body" are not specified - "common" section will be used
 *     targets: [{
 *         params: { userId: 1 },
 *         // query: { foo: bar },
 *         // body: { age: 32 }
 *     }, {
 *       params: { userId: 1 }
 *     }],
 *
 *     // common req data for all targes, has lower priority than "targets"
 *     common: {
 *         // params: { },
 *         // query: { },
 *         body: {
 *             age: 30
 *         }
 *     }
 * };
 * </code>
 *
 *
 * Response body example:
 * <code>
 * [
 *     {
 *         "ok": true,
 *         "code": 200,
 *         "value": {
 *             "id": 1,
 *             "name": "Some Name"
 *         }
 *     },
 *     {
 *         "ok": false,
 *         "code": 404,
 *         "value": {}
 *     }
 * ]
 * </code>
 * @param {*} req
 * @param {*} res
 */
function batchController(req, res) {
  const reqTemplate = req.body;
  const inerator = getRequestInerator(reqTemplate, Infinity);
  const queue = new JobQueue(1);
  for (const reqInfo of inerator) {
    debug && console.log('-- enqueue req', reqInfo);
    queue.add(reqInfo);
  }

  queue.run()
    .then((data) => {
      debug && console.log('-- batchController done');
      res.status(queue.getResultCode() || 200).json(queue.getResultData());
    })
    .catch((err) => {
      console.error('-- batchController error', err);
      res.status(queue.getResultCode() || 500).json(queue.getResultData());
    });
}


module.exports = { batchController };
