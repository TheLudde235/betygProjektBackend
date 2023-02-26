import Database from './services/database.js';
import { StatusCodes } from 'http-status-codes';
import { adminAuth, estateAuth, userAuth, workerAuth } from './middleware/auth.js';
import cookieParser from 'cookie-parser';
import bodyParser from 'body-parser';
import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';

import { getEstate, myEstates, registerEstate, updateEstate } from './routes/estate.js';
import { getAdmin, login, putAdmin, register } from './routes/admin.js';
import { getWorker, loginWorker, registerWorker, updateWorker } from './routes/worker.js';
import { confirmEmail, resendEmail } from './routes/email.js';
import { updateTask, createTask, getTask, getTasksFromEstate, deleteTask } from './routes/task.js';
import { createComment, deleteComment, getComments } from './routes/comment.js';
import { addWorker, deleteWorker as removeWorker } from './routes/workerEstateRelation.js';

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
});
app.get('/alreadyRegistered', async (req, res) => {
  return res.json({msg: (await cockDB.query('select * from workers where email=$1 or phone=$2', [req.query.email, req.query.phone])).rowCount > 0});
});

// Estates
app.get('/myEstates', adminAuth, myEstates);
app.post('/registerEstate', adminAuth, registerEstate);
app.put('/estate/:uuid', adminAuth, updateEstate);
app.get('/estate/:uuid', getEstate);

// Admins
app.put('/owner', adminAuth, putAdmin);
app.post('/register', register);
app.post('/login', login);
app.get('/owner/:uuid', getAdmin);

// Workers
app.put('/worker', workerAuth, updateWorker);
app.post(`/worker`, registerWorker);
app.get('/workerlogin/:email', loginWorker);
app.get('/worker/:uuid', getWorker);

  // estate relations
  app.post('/addworker/:estateuuid', adminAuth, estateAuth, addWorker);
  app.delete('/removeworker/:estateuuid', userAuth, estateAuth, removeWorker);

// Emails
app.get('/confirmMail/:confirmationuuid', confirmEmail);
app.post('/resendConfirmation/:email', resendEmail);

// Tasks
app.post('/task/:estateuuid', adminAuth, estateAuth, createTask);
app.get('/tasks/:estateuuid', userAuth, estateAuth, getTasksFromEstate);
app.put('/task/:taskuuid', adminAuth, updateTask);
app.delete('/task/:taskuuid', adminAuth, deleteTask);
app.get('/task/:taskuuid', getTask);

// Comments
app.post('/comment/:uuid', userAuth, createComment);
app.delete('/comment/:uuid', userAuth, deleteComment);
app.get('/comments/:taskuuid', userAuth, getComments);