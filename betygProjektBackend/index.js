import { ILoginUser, IRegisterUser } from './services/validation.js';
import { IRegisterUser, IRegisterWorker } from './services/validation.js';
import Database, { prefixes } from './services/database.js';
import { cookieOptions } from './services/cookie.js';
import { StatusCodes } from 'http-status-codes';
import { StatusCodes } from 'http-status-codes';
import { sendMail } from './services/mailer.js';
import cookieParser from 'cookie-parser';
import bodyParser from 'body-parser';
import bodyParser from 'body-parser';
import jwt from 'jsonwebtoken';
import express from 'express';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import cors from 'cors';

dotenv.config();

const jwtSecret = process.env.JWT_SECRET;
const salt = 10;
const db = new Database();
const app = express();

app.listen(3000, () => {
  console.log("STARTING SERVER", 3000);
});

app.use(cookieParser(process.env.COOKIE_SECRET));
app.use(bodyParser.json());

app.use(cors({
  origin: 'http://127.0.0.1:5173',
  credentials: true
}));

app.post('/register', async (req, res) => {
  try {
    await IRegisterRegisterUser.validateAsync(req.body);
  } catch (err) {
    res.status(StatusCodes.BAD_REQUEST);
    return res.json({msg: err.message});
    res.status(StatusCodes.BAD_REQUEST);
    return res.json({msg: err.message});
  }

  const {username, password, email} = req.body;

  if (await db.has(username.trim(), prefixes.user)) {
    res.status(StatusCodes.BAD_REQUEST);
    res.status(StatusCodes.BAD_REQUEST);
    return res.json({msg: 'Username is taken'});
  } 

  await db.set(username.trim(), {username: username.trim(), email, password: await bcrypt.hash(password, salt), estates: [], contacts: []}, prefixes.user);
  
  res.cookie('token', jwt.sign({username: username.trim()}, jwtSecret), cookieOptions);
  res.status(StatusCodes.CREATED);
  res.status(StatusCodes.ACCEPTED);
  res.json({msg: 'Created Succesfully'});
});

app.post('/login', async (req, res) => {
  try {
    const value = await ILoginUser.validateAsync(req.body);
  } catch (err) {
    res.status(StatusCodes.BAD_REQUEST);
    return res.json({msg: err.message});
  }

  const {username, password} = req.body;

  if (!await db.has(username.trim(), prefixes.user)) {
    res.status(StatusCodes.UNAUTHORIZED);
    return res.json({msg: 'bad username or password'});
  }

  const user = (await db.getByPrefix(prefixes.user + username))[0];

  if (!await bcrypt.compare(password, user.password)) {
    res.status(StatusCodes.UNAUTHORIZED);
    return res.json({msg: 'bad username or password'});
  }
app.get('/alreadyRegistered', async (req, res) => {
  res.json({msg: (await db.has(req.query.email, prefixes.worker))});
});

app.post(`/registerWorker`, async (req, res) => {
  try {
    await IRegisterWorker.validateAsync(req.body);
  } catch (err) {
    res.status(StatusCodes.BAD_REQUEST);
    return res.json({msg: err.message});
  }
  
  res.cookie('token', jwt.sign({username: username.trim()}, jwtSecret), cookieOptions);
  res.status(StatusCodes.ACCEPTED);
  res.json({msg: 'Sucessfully Logged In'});
});
  if (await db.has(req.body.email, prefixes.worker)) {
    res.status(StatusCodes.BAD_REQUEST);
    return res.json({msg: 'user already exists'});
  }

  const { email, name, phone } = req.body;

  await db.set(email, {name, phone}, prefixes.worker);
  res.status(StatusCodes.CREATED);
  res.cookie('token', jwt.sign({email}, jwtSecret), cookieOptions);
  res.json({msg: 'Successfully Registered'});
});