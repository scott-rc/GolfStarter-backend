/* eslint-disable no-underscore-dangle */
import express from 'express';
import http from 'http';
import cors from 'cors';
import bodyParser from 'body-parser';
import mongodb from 'mongodb';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import uuid from 'uuid';
import pwdGenerator from 'generate-password';

const CONNECTION_STRING = 'mongodb://golfstarter:production5@localhost:27017/golfstarter';
const STARTER_FORMS = 'starterForms';
const USERS = 'users';
const TOKEN_SECRET = 'golfstarter-production5';

// http status codes
const UNPROCESSABLE_ENTITY = 422;
const UNAUTHORIZED = 401;
const NOT_FOUND = 404;
const SERVER_ERROR = 500;

// errors
const INTERNAL_ERROR = { msg: 'Internal server error', code: 800 };
const NOT_ADMIN = { msg: 'Administrative rights are required', code: 700 };
const INVALID_TOKEN = { msg: 'Invalid token', code: 600 };
const WRONG_PASSWORD = { msg: 'Incorrect password', code: 500 };
const INVALID_PASSWORD = { msg: 'Invalid password', code: 300 };
const NO_USER = { msg: 'Couldn\'t find user with that username', code: 200 };
const USER_ALREADY_EXISTS = { msg: 'User already exists with that username', code: 900 };

const MongoClient = mongodb.MongoClient;
const ObjectID = mongodb.ObjectID;

const app = express();

app.use(bodyParser.json());
app.use(cors({ origin: 'http://localhost:8080', optionsSuccessStatus: 200 }));

app.all('*', async (req, res, next) => {
  const conn = await MongoClient.connect(CONNECTION_STRING);

  req.collections = {
    forms: conn.collection(STARTER_FORMS),
    users: conn.collection(USERS),
  };

  next();
});

app.all('/api/*', async (req, res, next) => {
  const token = req.get('authorization');

  try {
    req.decoded = await jwt.verify(token, TOKEN_SECRET);
    next();
  } catch (e) {
    res.status(UNAUTHORIZED).json(INVALID_TOKEN);
  }
});

app.all('/api/admin/*', async (req, res, next) => {
  if (req.decoded.isAdmin !== true) {
    return res.status(UNAUTHORIZED).json(NOT_ADMIN);
  }

  return next();
});

app.get('/api/starter-form', async (req, res) => {
  const formsCollection = req.collections.forms;
  const forms = await formsCollection.find({ username: req.decoded.username }).toArray();

  res.json(forms);
});

app.post('/api/starter-form', async (req, res) => {
  const form = req.body;
  const formsCollection = req.collections.forms;

  form.groupNumber = uuid();
  const result = await formsCollection.insertOne(form);

  res.json(result);
});

app.put('/api/starter-form', async (req, res) => {
  const form = req.body;
  const formsCollection = req.collections.forms;
  const _id = ObjectID(form._id);

  delete form._id;
  const result = await formsCollection.updateOne({ _id }, { $set: form });

  res.json(result);
});

app.patch('/api/starter-form', async (req, res) => {
  const formID = req.body.id;
  const formsCollection = req.collections.forms;

  try {
    await formsCollection.deleteOne({ _id: ObjectID(formID) });
    res.json();
  } catch (e) {
    res.status(SERVER_ERROR).json(INTERNAL_ERROR);
  }
});

app.post('/api/change-password', async (req, res) => {
  const params = req.body;
  const username = req.decoded.username;
  const userCollection = req.collections.users;
  const user = await userCollection.findOne({ username });

  if (user == null) {
    return res.status(NOT_FOUND).json(NO_USER);
  }

  const pw = params.password;
  const correctPassword = pw != null && await bcrypt.compare(pw, user.password);

  if (!correctPassword) {
    return res.status(UNAUTHORIZED).json(WRONG_PASSWORD);
  }

  const invalidPassword = params.newPassword == null || params.newPassword.length < 8;

  if (invalidPassword) {
    return res.status(UNPROCESSABLE_ENTITY).json(INVALID_PASSWORD);
  }

  const hashedPassword = await bcrypt.hash(params.newPassword, 10);
  userCollection.updateOne({ username }, { $set: { password: hashedPassword } });

  return res.json();
});

app.post('/login', async (req, res) => {
  const params = req.body;
  const userCollection = req.collections.users;
  const user = await userCollection.findOne({ username: params.username });

  if (user == null) {
    return res.status(NOT_FOUND).json(NO_USER);
  }

  const pw = params.password;
  const correctPassword = pw != null && await bcrypt.compare(pw, user.password);

  if (!correctPassword) {
    return res.status(UNAUTHORIZED).json(WRONG_PASSWORD);
  }

  const claims = { username: user.username, isAdmin: user.isAdmin };
  const token = jwt.sign(claims, TOKEN_SECRET);

  return res.json({ claims, token });
});

app.get('/login', async (req, res) => {
  const token = req.get('authorization');

  try {
    const decoded = await jwt.verify(token, TOKEN_SECRET);
    const userCollection = req.collections.users;
    const user = await userCollection.findOne({ username: decoded.username });

    if (user == null) {
      return res.status(NOT_FOUND).json(NO_USER);
    }

    return res.json(decoded);
  } catch (e) {
    return res.status(UNAUTHORIZED).json(INVALID_TOKEN);
  }
});

app.post('/api/admin/create-user', async (req, res) => {
  const user = req.body;
  const userCollection = req.collections.users;

  if (await userCollection.findOne({ username: user.username })) {
    return res.status(UNPROCESSABLE_ENTITY).json(USER_ALREADY_EXISTS);
  }

  const password = pwdGenerator.generate();

  const hashedUser = {
    ...user,
    password: await bcrypt.hash(password, 10),
  };

  userCollection.insertOne(hashedUser);

  return res.json({ ...user, password });
});

app.get('/api/admin/users', async (req, res) => {
  const userCollection = req.collections.users;
  const users = await userCollection.find().toArray();

  const usernames = users.filter(u => !u.isAdmin).map(u => u.username);
  const adminNames = users.filter(u => u.isAdmin).map(u => u.username);

  res.json({ usernames, adminNames });
});

app.post('/api/admin/delete-user', async (req, res) => {
  const username = req.body.username;
  const userCollection = req.collections.users;

  await userCollection.deleteOne({ username });

  res.json();
});

http.createServer(app).listen(process.env.PORT || 3000);
