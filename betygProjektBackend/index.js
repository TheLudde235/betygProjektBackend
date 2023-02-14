import { ILoginUser, IRegisterUser, IRegisterWorker, IEstate } from './services/validation.js';
import { v4 as uuidV4 } from 'uuid';
import Database from './services/database.js';
import { cookieOptions } from './helpers/cookie.js';
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
import { getTokenData } from './helpers/token.js';

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
  return res.json(obj);
});

app.get('/myEstates',adminAuth, async (req, res) => {
  const user = getTokenData(req);
  const adminID = (await cockDB.query('select adminuuid from administrators where username=$1', [user.username])).rows[0].adminuuid;
  return res.json((await cockDB.query('select * from estates where adminuuid=$1', [adminID])).rows);
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
    const uuid = uuidV4();
    await db.query('insert into administrators (adminuuid, username, email, password) values($1, $2, $3, $4)', [uuid, username.trim(), email, await bcrypt.hash(password, salt)]);  
    res.cookie('token', jwt.sign({username: username.trim(), admin: uuid}, jwtSecret, {expiresIn: '1h'}), cookieOptions);
    res.status(StatusCodes.CREATED);
    return res.json({msg: 'Created Succesfully'});
  } catch (err) {
    res.status(StatusCodes.BAD_REQUEST);
    return res.json({msg: err.message});
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
    const user = (await cockDB.query('select password, adminuuid from administrators where username=$1', [username])).rows[0];
    if (!await bcrypt.compare(password, user.password)) {
      throw Error('bad username or password');
    }
    res.setHeader('token', jwt.sign({username, admin: user.adminuuid}, jwtSecret, {expiresIn: '1h'}));
    return res.status(StatusCodes.OK).json({msg: 'logged in', token: jwt.sign({username, admin: user.adminuuid}, jwtSecret, {expiresIn: '1h'})});
  } catch(err) {
    res.status(StatusCodes.UNAUTHORIZED);
    return res.json({msg: 'bad username or password'});
  }
});

app.post('/registerEstate', adminAuth, async (req, res) => {
  try {
    await IEstate.validateAsync(req.body);
  } catch (err) {
    return res.status(StatusCodes.BAD_REQUEST).json({msg: err.message});
  }

  const estateuuid = uuidV4();
  
  try {
    const {city, street, streetnumber} = req.body;
    const { adminuuid }  = (await cockDB.query('select adminuuid from administrators where username=$1', [getTokenData(req).username])).rows[0];
    await cockDB.query('insert into estates (estateuuid, adminuuid, city, street, streetnumber) values ($1, $2, $3, $4, $5)', [estateuuid, adminuuid, city, street, streetnumber]);
  } catch (err) {
    return res.status(StatusCodes.BAD_REQUEST).json({msg: err.message});
  }

  return res.status(StatusCodes.CREATED).json({msg: 'Created successfully', id: estateuuid});
});



////////////////////////////////////////////////////////////////////////////////


app.get('/alreadyRegistered', async (req, res) => {
  return res.json({msg: (await cockDB.query('select * from workers where email=$1 or phone=$2', [req.query.email, req.query.phone])).rowCount > 1});
});

app.post(`/registerWorker`, async (req, res) => {
  try {
    await IRegisterWorker.validateAsync(req.body);
  } catch (err) {
    res.status(StatusCodes.BAD_REQUEST);
    return res.json({msg: err.message});
  }

  const { email, firstname, lastname, phone } = req.body;
  const skills = req.body.skills ?? '';
  const image = req.body.image ?? '';

  try {
    const uuid = uuidV4();
    sendMail({
      to: email,
      subject: 'Confirm your email',
      html: `
      <a href="http://localhost:3000/confirmMail/${uuid}">Click Here!</a>
      `
    });
    await cockDB.query('insert into tempworkers(email, firstname, lastname, phone, skills, image, confirmationuuid) values ($1, $2, $3, $4, $5, $6, $7)', [email, firstname, lastname, phone, skills, image, uuid]);
  } catch (err) {
    return res.status(StatusCodes.BAD_REQUEST).json({msg: err.message});
  }

  res.status(StatusCodes.OK);
  res.cookie('token', jwt.sign({email, admin: false}, jwtSecret), cookieOptions);
  return res.json({msg: 'Check email to confirm'});
});

app.get('/confirmMail/:confirmationuuid', async (req, res) => {
  const worker = (await (await cockDB.query('select * from tempworkers where confirmationuuid=$1', [req.params.confirmationuuid])).rows[0]);
  res.json({
    uuid: req.params.confirmationuuid,
    test: (await cockDB.query('delete from tempworkers where confirmationuuid=$1', [req.params.confirmationuuid])).rows
  });
});