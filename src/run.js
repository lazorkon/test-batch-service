const app = require('./index');
const port = 8080;

app.listen(port, () => {
  console.info(`batch-service is running on port ${port}`);
});
