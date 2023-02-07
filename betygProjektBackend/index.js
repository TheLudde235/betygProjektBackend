import Database, { prefixes } from './services/database.js';
import { cookieOptions } from './services/cookie.js';
import cookieParser from 'cookie-parser';
import jwt from 'jsonwebtoken';
import express from 'express';
import bcrypt from 'bcryptjs';
import cors from 'cors';
import bodyParser from 'body-parser';

const jwtSecret = 'nyckelbrädakatt';
const salt = 10;
const db = new Database();
const app = express();


console.log(await db.list())


app.listen(3000, () => {
  console.log("STARTING SERVER")
});
app.use(cookieParser('cookieSecret'));
app.use(bodyParser.json());
app.use(cors({
  origin: 'http://127.0.0.1:5173',
  credentials: true
}));

app.get('/', (req, res) => {
  res.set("Access-Control-Expose-Headers", "cookie set-cookie");
  const token = 'yes, this is token';
  res.cookie('token', jwt.sign(token, jwtSecret), cookieOptions);
  res.json(res.getHeaders());
});

app.post('/register', async (req, res) => {
  try {
    JSON.parse(req.body);
  } catch (err) {
    console.error(err);
    return res.json({msg: 'body was malformed'})
  }
  if (!req.body) {
    console.error(err);
    res.status(400);
    return res.json({msg: 'body was missing'})
  }
  

  const { username, password } = req.body;
  if (!username) {
    res.status(400);
    return res.json({msg: 'username was missing or malformed'})
  }

  if (!password) {
    res.status(400);
    return res.json({msg: 'password was missing or malformed'})
  }

  if (await db.has(username.trim(), prefixes.user)) {
    res.status(400)
    return res.json({msg: 'Username is taken'});
  } 
  await db.set(username.trim(), {username: username.trim(), password: await bcrypt.hash(password, salt), estates: [], contacts: []}, prefixes.user);
  res.cookie('token', jwt.sign({username: username.trim()}, jwtSecret), cookieOptions);
  res.status(201)
  res.json({msg: 'Created Succesfully'});
});


// (await db.list(prefixes.user)).forEach(async match => {await db.delete(match)})