import { ITask } from "../services/validation.js";
import { dbClient } from "../index.js";
import { StatusCodes } from "http-status-codes";
import { getUpdateQuery } from "../helpers/update.js";
import { sendMail } from "../services/mailer.js";
import { getError } from "../services/betterErrors.js";

export const createTask = async (req, res) => {
  try {
    await ITask.validateAsync(req.body);
  } catch (err) {
    return res.status(StatusCodes.BAD_REQUEST).json({msg: err.message});
  }
  const { title, description, priority, open } = req.body;
  const deadline = req.body.deadline && req.body.deadline != 0 ? req.body.deadline : null;
  const estateuuid = req.params.estateuuid;
  const adminuuid = res.locals.tokenData.uuid;

  try {
    await dbClient.query('insert into tasks (title, description, estateuuid, priority, deadline, open) values($1, $2, $3, $4, $5, $6)', [title, description, estateuuid, priority, deadline, open]);
    return res.status(StatusCodes.CREATED).json({msg: 'Created task succesfully'});
  } catch (err) {
    return res.status(StatusCodes.BAD_REQUEST).json({msg: err.message});
  }
};

export const getTask = async (req, res) => {
  try {
    const task = (await dbClient.query('select * from tasks where taskuuid=$1', [req.params.taskuuid])).rows[0];
    return res.status(StatusCodes.OK).json({task});
  } catch (err) {
    return res.status(StatusCodes.BAD_REQUEST).json({msg: err.message});
  }
};

export const getTasksFromEstate = async (req, res) => {
  try {
    const tasks = (await dbClient.query('select * from tasks where estateuuid=$1', [req.params.estateuuid])).rows;
    return res.status(StatusCodes.OK).json({tasks});
  } catch (err) {
    return res.status(StatusCodes.BAD_REQUEST).json({msg: err.message});
  }
};

export const updateTask = async (req, res) => {
  try {
    if (res.locals.tokenData.admin) {
      const {query, values} = getUpdateQuery(['title', 'description', 'completed', 'taskmaster', 'deadline', 'priority', 'open'], 'tasks', req.body, {
        'taskuuid': req.params.taskuuid
      });
      await dbClient.query(query, values);
    } else {
      const {query, values} = getUpdateQuery(['title', 'description', 'completed', 'taskmaster', 'deadline', 'priority'], 'tasks', req.body, {
        'taskuuid': req.params.taskuuid
      });
      await dbClient.query(query, values);
      if (req.body.taskmaster === null) {
        const adminMail = (await dbClient.query('select email from administrators where adminuuid in (select adminuuid from estates where estateuuid in (select estateuuid from tasks where taskuuid=$1))', [req.params.taskuuid])).rows[0].email;
        const taskTitle = (await dbClient.query('select title from tasks where taskuuid=$1', [req.params.taskuuid])).rows[0].title;
        sendMail({
          to: adminMail,
          subject: 'Worker changed their mind',
          text: `A Worker removed themselves from ${taskTitle}`
        })
      }
    }
    res.status(StatusCodes.OK).json({msg: 'Update succesfull'});
  } catch (err) {
    res.status(StatusCodes.BAD_REQUEST).json({msg: err.message});
  }
};

export const takeTask = async (req, res) => {
  try {
    const matches = (await dbClient.query('select estateuuid, title from tasks where taskuuid=$1 and estateuuid in (select estateuuid from estate_worker_relations where workeruuid=$2)', [req.params.taskuuid, req.body.taskmaster])).rows;
    if (matches.length < 1) throw Error('server.error.not_authorized');
    const {query, values} = getUpdateQuery(['taskmaster'], 'tasks', req.body, {
      'taskuuid': req.params.taskuuid
    });
    await dbClient.query(query, values);
    const adminEmail = (await dbClient.query('select email from administrators where adminuuid in (select adminuuid from estates where estateuuid=$1)', [matches[0].estateuuid])).rows[0].email;
    await sendMail({
      to: adminEmail,
      subject: 'Task "' + matches[0].title + '" has been accepted',
      text: 'The task has been accepted by a worker, check the comments to see the preliminary costs and time'
    })
    res.status(StatusCodes.ACCEPTED).json({msg: 'task taken'})
  } catch (err) {
    res.status(StatusCodes.BAD_REQUEST).json({msg: err.message});
  }
}

export const deleteTask = async (req, res) => {
  try {
    await dbClient.query('delete from comments where taskuuid=$1', [req.params.taskuuid]);
    await dbClient.query('delete from tasks where taskuuid=$1', [req.params.taskuuid]);
    res.status(StatusCodes.ACCEPTED).json({msg: 'Task deleted'});
  } catch (err) {
    res.status(StatusCodes.BAD_REQUEST).json({msg: err.message});
  }
}

export const getTasks = async (req, res) => {
  try {
    let tasks;
    if (res.locals.tokenData.admin) {
      tasks = (await dbClient.query('select * from tasks where estateuuid in (select estateuuid from estates where adminuuid=$1', [req.locals.tokenData.uuid])).rows;
    } else {
      tasks = (await dbClient.query('select * from tasks where taskmaster=$1', [res.locals.tokenData.uuid])).rows;
    }
    return res.status(StatusCodes.ACCEPTED).json({tasks});
  } catch (err) {
    return res.status(StatusCodes.BAD_REQUEST).json({msg: getError(err.message)});
  }
}