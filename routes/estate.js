import { IEstate } from '../services/validation.js';
import { v4 as uuidV4 } from 'uuid';
import { StatusCodes } from 'http-status-codes';
import { dbClient } from '../index.js';
import { getUpdateQuery } from '../helpers/update.js';

export const registerEstate = async (req, res) => {
  try {
    await IEstate.validateAsync(req.body);
  } catch (err) {
    return res.status(StatusCodes.BAD_REQUEST).json({msg: err.message});
  }

  const estateuuid = uuidV4();
  
  try {
    const {city, street, streetnumber, description} = req.body;
    const uuid  = res.locals.tokenData.uuid;
    await dbClient.query('insert into estates (estateuuid, adminuuid, city, street, streetnumber, description) values ($1, $2, $3, $4, $5, $6)', [estateuuid, uuid, city, street, streetnumber, description]);
  } catch (err) {
    return res.status(StatusCodes.BAD_REQUEST).json({msg: err.message});
  }

  return res.status(StatusCodes.CREATED).json({msg: 'Created successfully', id: estateuuid});
};

export const myEstates = async (req, res) => {
  const user = res.locals.tokenData;
  try {
    if (user.admin) {
      return res.json((await dbClient.query('select * from estates where adminuuid=$1', [user.uuid])).rows);
    } else {
      return res.json((await dbClient.query('select * from estates where estateuuid in (select estateuuid from estate_worker_relations where workeruuid=$1)', [user.uuid])).rows);
    }
  } catch (err) {
    res.status(StatusCodes.BAD_REQUEST).json({msg: err.message});
  }
};

export const getEstate = async (req, res) => {
  try {
    const estate = (await dbClient.query('select * from estates where estateuuid=$1', [req.params.estateuuid])).rows[0];
    const tasks = (await dbClient.query('select * from tasks where estateuuid=$1', [req.params.estateuuid])).rows;
    const workers = (await dbClient.query('select * from workers where workeruuid in (select workeruuid from estate_worker_relations where estateuuid=$1)', [req.params.estateuuid])).rows;
    if (!estate) throw Error(`estate with uuid ${req.params.estateuuid} not found`);
    res.status(StatusCodes.OK).json({ estate, tasks, workers });
  } catch (err) {
    res.status(StatusCodes.NOT_FOUND).json({msg: err.message});
  }
};

export const updateEstate = async (req, res) => {
  try {
    const {query, values} = getUpdateQuery(['city', 'street', 'streetnumber', 'description'], 'estates', req.body, {
      'estateuuid': req.params.estateuuid,
      'adminuuid': res.locals.tokenData.uuid
    });
    await dbClient.query(query, values);
    return res.status(StatusCodes.ACCEPTED).json({msg: 'Updated succesfully'});
  } catch (err) {
    res.status(StatusCodes.BAD_REQUEST).json({msg: err.message});
  }
};

export const deleteEstate = async (req, res) => {
  try {
    await dbClient.query('delete from estate_worker_relations where estateuuid=$1', [req.params.estateuuid]);
    await dbClient.query('delete from comments where taskuuid in (select taskuuid from tasks where estateuuid = $1)', [req.params.estateuuid]);
    await dbClient.query('delete from tasks where estateuuid=$1', [req.params.estateuuid]);
    await dbClient.query('delete from estates where estateuuid=$1', [req.params.estateuuid]);
    return res.status(StatusCodes.ACCEPTED).json({msg: 'server.message.delete_estate'});
  } catch(err) {
    res.status(StatusCodes.BAD_REQUEST).json({msg: err.message});
  }
}