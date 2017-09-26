const express = require('express');
const http = require('http');
const cors = require('cors');
const bodyParser = require('body-parser');
const mongoClient = require('mongodb').MongoClient;

const app = express();
const server = http.createServer(app);
const port = process.env.PORT || 3000;

app.use(bodyParser.json());
app.use(cors({
  origin: 'http://localhost:8080',
  optionsSuccessStatus: 200,
}));

app.all('*', async (req, res, next) => {
  req.db = await mongoClient.connect('mongodb://golfstarter:production5@localhost:27017/golfstarter');
  next();
});

app.get('/starter-form/:username', async (req, res) => {
  const forms = await req.db.collection('starterForms').find({ username: req.params.username });
  res.json(await forms.toArray());
});

app.post('/starter-form', async (req, res) => {
  const result = await req.db.collection('starterForms').insertOne(req.body);
  res.json(result);
});

app.put('/starter-form', async (req, res) => {
  /* eslint-disable no-underscore-dangle */
  delete req.body._id;
  const result = await req.db.collection('starterForms').updateOne({ groupNumber: req.body.groupNumber }, { $set: req.body });
  res.json(result);
});

server.listen(port, () => {
  console.log(`Listening for requests on port ${port}.`);
});
