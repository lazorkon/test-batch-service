const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const bodyParser = require('body-parser');

const app = express();

app.disable('x-powered-by');
app.use(cors());
app.use(helmet.noSniff());
app.use(helmet.xssFilter());
app.use(helmet.noCache());
// app.use(compression());
app.use(bodyParser.json({ limit: '2mb' }));
app.use(bodyParser.urlencoded({ extended: false, limit: '2mb' }));

module.exports = { app };
