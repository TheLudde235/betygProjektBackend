import Database from './services/database.js';
import { adminAuth, estateAuth, taskAuth, userAuth, watchEstateAuth, workerAuth } from './middleware/auth.js';
import cookieParser from 'cookie-parser';
import bodyParser from 'body-parser';
import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';

import { deleteEstate, getEstate, myEstates, registerEstate, updateEstate } from './routes/estate.js';
import { adminRegistered, getAdmin, login, putAdmin, register } from './routes/admin.js';
import { getWorker, getWorkers, loginWorker, registerWorker, updateWorker, workerRegistered } from './routes/worker.js';
import { confirmEmail, resendEmail } from './routes/email.js';
import { updateTask, createTask, getTask, getTasksFromEstate, deleteTask, takeTask, getTasks } from './routes/task.js';
import { createComment, deleteComment, getComments } from './routes/comment.js';
import { addWorker, getInvites, getWorkersFromEstate, removeWorker } from './routes/workerEstateRelation.js';

dotenv.config();

const db = new Database();
const app = express();

export const salt = 10;
export const dbClient = await db.getClient();

dotenv.config();

app.listen(process.env.PORT, () => {
  console.log("STARTING SERVER", process.env.PORT);
});

app.use(cookieParser(process.env.COOKIE_SECRET));
app.use(bodyParser.json());

app.use(cors({
  origin: process.env.HOST,
  credentials: 'include'
}));

app.get('/alreadyRegistered', async (req, res) => {
  return res.json({ msg: (await dbClient.query('select * from workers where email=$1 or phone=$2', [req.query.email, req.query.phone])).rowCount > 0 });
});

// Estates
app.get('/myEstates', userAuth, myEstates);
app.post('/registerestate', adminAuth, registerEstate);
app.put('/estate/:estateuuid', adminAuth, estateAuth, updateEstate);
app.get('/estate/:estateuuid', userAuth, watchEstateAuth, getEstate);
app.delete('/estate/:estateuuid', adminAuth, estateAuth, deleteEstate);

// Admins
app.put('/owner', adminAuth, putAdmin);
app.post('/register', register);
app.post('/login', login);
app.get('/owner/:uuid', getAdmin);
app.get('/adminregistered', adminRegistered);

// Workers
app.put('/worker', workerAuth, updateWorker);
app.post('/worker', registerWorker);
app.get('/workerlogin/:email', loginWorker);
app.get('/worker/:uuid', getWorker);
app.get('/workers', adminAuth, getWorkers);
app.get('/workerregistered', workerRegistered);

// estate relations
app.post('/addworker/:estateuuid', adminAuth, estateAuth, addWorker);
app.delete('/removeworker/:estateuuid', userAuth, estateAuth, removeWorker);
app.get('/myinvites', workerAuth, getInvites);
app.get('/workers/:estateuuid', adminAuth, estateAuth, getWorkersFromEstate);

// Emails
app.get('/confirmMail/:confirmationuuid', confirmEmail);
app.get('/resendConfirmation/:email', resendEmail);

// Tasks
app.post('/task/:estateuuid', adminAuth, estateAuth, createTask);
app.post('/taketask/:taskuuid', workerAuth, takeTask);
app.get('/tasks/:estateuuid', userAuth, estateAuth, getTasksFromEstate);
app.put('/task/:taskuuid', userAuth, taskAuth, updateTask);
app.delete('/task/:taskuuid', adminAuth, deleteTask);
app.get('/task/:taskuuid', getTask);
app.get('/mytasks', userAuth, getTasks);

// Comments
app.post('/comment/:taskuuid', userAuth, taskAuth, createComment);
app.delete('/comment/:commentuuid', userAuth, deleteComment);
app.get('/comments/:taskuuid', userAuth, taskAuth, getComments);