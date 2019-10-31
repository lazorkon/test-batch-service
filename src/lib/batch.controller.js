const { getRequestInerator } = require('./request-template');
const { JobQueue } = require('./job-queue');

const debug = true;

// todo: validate request with joi
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
