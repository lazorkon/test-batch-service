const { app } = require('./lib/server');
const { batchController } = require('./lib/batch.controller');

app.post('/batch', batchController);

module.exports = app;
