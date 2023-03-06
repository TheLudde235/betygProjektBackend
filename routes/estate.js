import { IEstate } from '../services/validation.js';
import { v4 as uuidV4 } from 'uuid';
import { StatusCodes } from 'http-status-codes';
import { cockDB } from '../index.js';
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
    await cockDB.query('insert into estates (estateuuid, adminuuid, city, street, streetnumber, description) values ($1, $2, $3, $4, $5, $6)', [estateuuid, uuid, city, street, streetnumber, description]);
  } catch (err) {
    return res.status(StatusCodes.BAD_REQUEST).json({msg: err.message});
  }

  return res.status(StatusCodes.CREATED).json({msg: 'Created successfully', id: estateuuid});
};

export const myEstates = async (req, res) => {
  const user = res.locals.tokenData;
  try {
    return res.json((await cockDB.query('select * from estates where adminuuid=$1', [user.uuid])).rows);
  } catch (err) {
    res.status(StatusCodes.BAD_REQUEST).json({msg: err.message});
  }
};

export const getEstate = async (req, res) => {
  try {
    const estate = (await cockDB.query('select * from estates where estateuuid=$1', [req.params.uuid])).rows[0];
    if (!estate) throw Error(`estate with uuid ${req.params.uuid} not found`);
    res.status(StatusCodes.OK).json({ estate });
  } catch (err) {
    res.status(StatusCodes.NOT_FOUND).json({msg: err.message});
  }
};

export const updateEstate = async (req, res) => {
  try {
    const {query, values} = getUpdateQuery(['city', 'street', 'streetnumber', 'description'], 'estates', req.body, {
      'estateuuid': req.params.uuid,
      'adminuuid': res.locals.tokenData.uuid
    });
    await cockDB.query(query, values);
    return res.status(StatusCodes.ACCEPTED).json({msg: 'Updated succesfully'});
  } catch (err) {
    res.status(StatusCodes.BAD_REQUEST).json({msg: err.message});
  }
};