import Database, { prefixes } from './services/database.js';
import { cookieOptions } from './services/cookie.js';
import cookieParser from 'cookie-parser';
import jwt from 'jsonwebtoken';
import express from 'express';
import bcrypt from 'bcryptjs';
import cors from 'cors';
import bodyParser from 'body-parser';
import { IUser } from './services/validation.js';

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

app.post('/register', async (req, res) => {
  try {
    const value = await IUser.validateAsync(req.body);
  } catch (err) {
    console.error(err);
    return res.json({msg: err.message})
  }
  const {username, password, email} = req.body;

  if (await db.has(username.trim(), prefixes.user)) {
    res.status(400)
    return res.json({msg: 'Username is taken'});
  } 
  await db.set(username.trim(), {username: username.trim(), email, password: await bcrypt.hash(password, salt), estates: [], contacts: []}, prefixes.user);
  res.cookie('token', jwt.sign({username: username.trim()}, jwtSecret), cookieOptions);
  res.status(201)
  res.json({msg: 'Created Succesfully'});
});




// (await db.list(prefixes.user)).forEach(async match => {await db.delete(match)})