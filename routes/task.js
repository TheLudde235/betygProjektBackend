import { ITask } from "../services/validation.js";
import { cockDB } from "../index.js";
import { StatusCodes } from "http-status-codes";
import { getUpdateQuery } from "../helpers/update.js";

export const createTask = async (req, res) => {
  try {
    await ITask.validateAsync(req.body);
  } catch (err) {
    return res.status(StatusCodes.BAD_REQUEST).json({msg: err.message});
  }
  const { title, description, priority, deadline, open } = req.body;
  console.log(req.body)
  const estateuuid = req.params.estateuuid;
  const adminuuid = res.locals.tokenData.uuid;

  try {
    await cockDB.query('insert into tasks (title, description, estateuuid, taskmaster, priority, deadline, open) values($1, $2, $3, $4, $5, $6, $7)', [title, description, estateuuid, adminuuid, priority, deadline, open]);
    return res.status(StatusCodes.CREATED).json({msg: 'Created task succesfully'});
  } catch (err) {
    return res.status(StatusCodes.BAD_REQUEST).json({msg: err.message});
  }
};

export const getTask = async (req, res) => {
  try {
    const task = (await cockDB.query('select * from tasks where taskuuidv1=$1', [req.params.taskuuid])).rows[0];
    return res.status(StatusCodes.OK).json({task});
  } catch (err) {
    return res.status(StatusCodes.BAD_REQUEST).json({msg: err.message});
  }
};

export const getTasksFromEstate = async (req, res) => {
  try {
    const tasks = (await cockDB.query('select * from tasks where estateuuid=$1', [req.params.estateuuid])).rows;
    return res.status(StatusCodes.OK).json({tasks});
  } catch (err) {
    return res.status(StatusCodes.BAD_REQUEST).json({msg: err.message});
  }
};

export const updateTask = async (req, res) => {
  try {
    const {query, values} = getUpdateQuery(['title', 'description', 'completed', 'taskmaster', 'deadline', 'priority'], 'tasks', req.body, {
      'taskuuid': req.params.taskuuid
    });
    await cockDB.query(query, values);
    res.status(StatusCodes.OK).json({msg: 'Update succesfull'});
  } catch (err) {
    res.status(StatusCodes.BAD_REQUEST).json({msg: err.message});
  }
};

export const deleteTask = async (req, res) => {
  try {
    await cockDB.query('delete from comments where taskuuid=$1', [req.params.taskuuid]);
    await cockDB.query('delete from tasks where taskuuid=$1', [req.params.taskuuid]);
    res.status(StatusCodes.ACCEPTED).json({msg: 'Task deleted'});
  } catch (err) {
    res.status(StatusCodes.BAD_REQUEST).json({msg: err.message});
  }
}