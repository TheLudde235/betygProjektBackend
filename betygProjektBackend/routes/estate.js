import { IEstate } from '../services/validation.js';
import { v4 as uuidV4 } from 'uuid';
import { StatusCodes } from 'http-status-codes';
import { cockDB } from '../index.js';
export const registerEstate = async (req, res) => {
  try {
    await IEstate.validateAsync(req.body);
  } catch (err) {
    return res.status(StatusCodes.BAD_REQUEST).json({msg: err.message});
  }

  const estateuuid = uuidV4();
  
  try {
    const {city, street, streetnumber} = req.body;
    const { adminuuid }  = (await cockDB.query('select adminuuid from administrators where username=$1', [res.locals.tokenData.username])).rows[0];
    await cockDB.query('insert into estates (estateuuid, adminuuid, city, street, streetnumber) values ($1, $2, $3, $4, $5)', [estateuuid, adminuuid, city, street, streetnumber]);
  } catch (err) {
    return res.status(StatusCodes.BAD_REQUEST).json({msg: err.message});
  }

  return res.status(StatusCodes.CREATED).json({msg: 'Created successfully', id: estateuuid});
};

export const myEstates = async (req, res) => {
  const user = res.locals.tokenData;
  try {
    return res.json((await cockDB.query('select * from estates where adminuuid=$1', [user.admin])).rows);
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