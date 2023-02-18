import Database from './services/database.js';
import { StatusCodes } from 'http-status-codes';
import { adminAuth, workerAuth } from './middleware/auth.js';
import cookieParser from 'cookie-parser';
import bodyParser from 'body-parser';
import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';

import { getEstate, myEstates, registerEstate } from './routes/estate.js';
import { getAdmin, login, putAdmin, register } from './routes/admin.js';
import { getWorker, loginWorker, registerWorker, updateWorker } from './routes/worker.js';
import { confirmEmail, resendEmail } from './routes/email.js';
import { createTask } from './routes/task.js';

dotenv.config();

const db = new Database();
const app = express();

export const salt = 10;
export const cockDB = await db.getClient();

dotenv.config();

app.listen(process.env.PORT, () => {
  console.log("STARTING SERVER", process.env.PORT);
});

app.use(cookieParser(process.env.COOKIE_SECRET));
app.use(bodyParser.json());

app.use(cors({
  origin: 'http://127.0.0.1:5173',
  credentials: true
}));

app.get('/table', adminAuth, async (req, res) => {
  const rows = (await cockDB.query('show tables')).rows;
  const obj = {};
  for (const row of rows) {
    obj[row.table_name] = (await cockDB.query('select * from ' + row.table_name)).rows;
  }
  return res.json(obj);
});

app.get('/table/:table', adminAuth, async (req, res) => {
  try {
    return res.json((await cockDB.query('select * from ' + req.params.table)).rows);
  } catch (err) {
    return res.status(StatusCodes.BAD_REQUEST).json({msg: err.message});
  }
})

app.get('/alreadyRegistered', async (req, res) => {
  return res.json({msg: (await cockDB.query('select * from workers where email=$1 or phone=$2', [req.query.email, req.query.phone])).rowCount > 0});
});

// Estates
app.get('/myEstates', adminAuth, myEstates);
app.get('/estate/:uuid', getEstate);
app.post('/registerEstate', adminAuth, registerEstate);

// Admins
app.post('/register', register);
app.post('/login', login);
app.get('/owner/:uuid', getAdmin);
app.put('/owner', adminAuth, putAdmin);

// Workers
app.post(`/worker`, registerWorker);
app.get('/workerlogin/:email', loginWorker);
app.get('/worker/:uuid', getWorker);
app.put('/worker', workerAuth, updateWorker);

// Emails
app.get('/confirmMail/:confirmationuuid', confirmEmail);
app.post('/resendConfirmation/:email', resendEmail);

// Tasks
app.post('/task', adminAuth, createTask);