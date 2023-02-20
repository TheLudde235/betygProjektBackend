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
  const { title, description, estateuuid } = req.body;

  const adminuuid = res.locals.tokenData.admin;

  try {
    await cockDB.query('insert into tasks (title, description, estateuuid, adminuuid) values($1, $2, $3, $4)', [title, description, estateuuid, adminuuid]);
    return res.status(StatusCodes.CREATED).json({msg: 'Created task succesfully'});
  } catch (err) {
    return res.status(StatusCodes.BAD_REQUEST).json({msg: err});
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
    const {query, values} = getUpdateQuery(['title', 'description', 'completed'], 'tasks', req.body, {
      'adminuuid': res.locals.tokenData.admin,
      'taskuuidv1': req.params.uuid
    });
    await cockDB.query(query, values);
    res.status(StatusCodes.OK).json({msg: 'Update succesfull'});
  } catch (err) {
    res.status(StatusCodes.BAD_REQUEST).json({msg: err.message});
  }
};

export const deleteTask = async (req, res) => {
  try {
    await cockDB.query('delete from tasks where adminuuid=$1 and taskuuidv1=$2', [res.locals.tokenData.admin, req.params.taskuuid]);
    res.status(StatusCodes.ACCEPTED).json({msg: 'Task deleted'});
  } catch (err) {
    res.status(StatusCodes.BAD_REQUEST).json({msg: err.message});
  }
}