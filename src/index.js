const { app } = require('./lib/server');
const { batchController } = require('./lib/batch.controller');

app.post('/batch', batchController);

// 404 handler
app.use((req, res, next) => {
  const message = 'Not found';
  res.status(404);

  if (req.accepts('json')) {
    res.send({ message });
  } else {
    res.type('txt').send(error);
  }
});

// error handler
app.use((err, req, res, next) => {
  console.error('-- req error', err.stack);
  const message = 'Internal Server Error';

  res.status(500);
  if (req.accepts('json')) {
    res.send({ message });
  } else {
    res.type('txt').send(error);
  }

});

module.exports = app;
