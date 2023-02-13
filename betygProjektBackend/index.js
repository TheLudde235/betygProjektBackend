import { ILoginUser, IRegisterUser, IRegisterWorker } from './services/validation.js';
import { atob } from './services/base64.js';
import Database from './services/database.js';
import { cookieOptions } from './services/cookie.js';
import { StatusCodes } from 'http-status-codes';
import { adminAuth } from './middleware/auth.js';
import { sendMail } from './services/mailer.js';
import cookieParser from 'cookie-parser';
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
const cockDB = await db.getClient();

app.listen(process.env.PORT, () => {
  console.log("STARTING SERVER", process.env.PORT);
});

app.use(cookieParser(process.env.COOKIE_SECRET));
app.use(bodyParser.json());

app.use(cors({
  origin: 'http://127.0.0.1:5173',
  credentials: true
}));

app.get('/', adminAuth ,async (req, res) => {
  const rows = (await cockDB.query('show tables')).rows;
  const obj = {};
  for (const row of rows) {
    obj[row.table_name] = (await cockDB.query('select * from ' + row.table_name)).rows;
  }
  res.json(obj);
});

app.get('/myEstates',adminAuth, async (req, res) => {
  const user = JSON.parse(atob(req.headers.authorization.split(' ')[1].split('.')[1]));
  const adminID = (await cockDB.query('select adminUUID from administrators where username=$1', [user.username])).rows[0].adminuuid;
  res.json(await cockDB.query('select * from estates where adminuuid=$1', [adminID]).rows)
});

app.post('/register', async (req, res) => {
  try {
    await IRegisterUser.validateAsync(req.body);
  } catch (err) {
    res.status(StatusCodes.BAD_REQUEST);
    return res.json({msg: err.message});
  }

  const { username, password, email} = req.body;

  try {
    await db.query('insert into administrators (username, email, password) values($1, $2, $3)', [username.trim(), email, await bcrypt.hash(password, salt)]);  
    res.cookie('token', jwt.sign({username: username.trim(), admin: true}, jwtSecret), cookieOptions);
    res.status(StatusCodes.CREATED);
    res.json({msg: 'Created Succesfully'});
  } catch (err) {
    res.status(StatusCodes.BAD_REQUEST);
    res.json({msg: err.message});
  }
});

app.post('/login', async (req, res) => {
  try {
    await ILoginUser.validateAsync(req.body);
  } catch (err) {
    res.status(StatusCodes.BAD_REQUEST);
    return res.json({msg: err.message});
  }

  const {username, password} = req.body;
  try {
    const pw = (await cockDB.query('select password from administrators where username=$1', [username])).rows[0].password;
    if (!await bcrypt.compare(password, pw)) {
      throw Error('bad username or password');
    }
    res.setHeader('token', jwt.sign({username, admin: true}, jwtSecret));
    res.status(StatusCodes.OK).json({msg: 'logged in'});
  } catch(err) {
      res.status(StatusCodes.UNAUTHORIZED);
      return res.json({msg: 'bad username or password'});
  }
});

app.post('/registerEstate', adminAuth,async (req, res) => {
  console.log('this is happening!!');
});





////////////////////////////////////////////////////////////////////////////////
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