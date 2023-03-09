import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
import { StatusCodes } from 'http-status-codes';
import { dbClient } from '../index.js';
dotenv.config();

export function adminAuth(req, res, next) {
  if (!req.headers.authorization) {
    return res.status(StatusCodes.BAD_REQUEST).json({msg: 'No credentials sent'});
  }

  try {
    const { authorization } = req.headers;
    const token = authorization.split(' ')[1];
    

    res.locals.tokenData = jwt.verify(token, process.env.JWT_SECRET);
    if (!res.locals.tokenData.admin) return res.status(StatusCodes.FORBIDDEN).json({msg: 'User is not admin'});
  } catch (err) {
    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({msg: err.message});
  }
  next();
};

export function workerAuth(req, res, next) {
  if (!req.headers.authorization) {
    return res.status(StatusCodes.BAD_REQUEST).json({msg: 'No credentials sent'});
  }

  try {
    const { authorization } = req.headers;
    const token = authorization.split(' ')[1];

    res.locals.tokenData = jwt.verify(token, process.env.JWT_SECRET);
    if (res.locals.tokenData.admin) return res.status(StatusCodes.FORBIDDEN).json({msg: 'User is not worker'});
  } catch (err) {
    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({msg: err.message});
  }
  next();
};

export function userAuth(req, res, next) {
  if (!req.headers.authorization) {
    return res.status(StatusCodes.BAD_REQUEST).json({msg: 'No credentials sent'});
  }

  try {
    const { authorization } = req.headers;

    const token = authorization.split(' ')[1];

    res.locals.tokenData = jwt.verify(token, process.env.JWT_SECRET);
    
  } catch (err) {
    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({msg: err.message});
  }
  next();
};

export async function estateAuth(req, res, next) {
  const uuid = res.locals.tokenData.uuid ?? res.locals.tokenData.admin;

  try {
    if (res.locals.tokenData.admin) {
      const matches = (await dbClient.query('select adminuuid from estates where adminuuid=$1 and estateuuid=$2', [uuid, req.params.estateuuid])).rows;
      if (matches.length <= 0) {
        return res.status(StatusCodes.NOT_ACCEPTABLE).json({msg: 'You are not authorized to view information for estate ' + req.params.estateuuid});
      }
    } else {
      const matches = (await dbClient.query('select workeruuid from estate_worker_relations where workeruuid=$1 and estateuuid=$2', [uuid, req.params.estateuuid])).rows;

      if (matches.length <= 0) {
        return res.status(StatusCodes.NOT_ACCEPTABLE).json({msg: 'You are not authorized to view information for estate ' + req.params.estateuuid});
      }
    } 
  } catch (err) {
    return res.status(StatusCodes.BAD_REQUEST).json({msg: err.message});
  }
  next();
};

export async function watchEstateAuth(req, res, next) {
  const uuid = res.locals.tokenData.uuid ?? res.locals.tokenData.admin;

  try {
    if (res.locals.tokenData.admin) {
      const matches = (await dbClient.query('select adminuuid from estates where adminuuid=$1 and estateuuid=$2', [uuid, req.params.estateuuid])).rows;
      if (matches.length <= 0) {
        return res.status(StatusCodes.NOT_ACCEPTABLE).json({msg: 'You are not authorized to view information for estate ' + req.params.estateuuid});
      }
    } else {
      const matches = (await dbClient.query('select workeruuid from estate_worker_relations where workeruuid=$1 and estateuuid=$2', [uuid, req.params.estateuuid])).rows;
      const confirmations = (await dbClient.query('select useruuid from emailconfirmations where useruuid=$1 and information=$2', [uuid, req.params.estateuuid])).rows;

      if (matches.length <= 0 && confirmations.length <= 0) {
        return res.status(StatusCodes.NOT_ACCEPTABLE).json({msg: 'You are not authorized to view information for estate ' + req.params.estateuuid});
      }
    } 
  } catch (err) {
    return res.status(StatusCodes.BAD_REQUEST).json({msg: err.message});
  }
  next();
};

export async function taskAuth(req, res, next) {
  const token = res.locals.tokenData;
  try {
    let matches;
    if (token.admin) {
      matches = (await dbClient.query('select estateuuid from tasks where estateuuid in (select estateuuid from estates where adminuuid=$1)', [token.uuid])).rows;
    } else {
      matches = (await dbClient.query('select taskmaster from tasks where taskmaster=$1', [token.uuid])).rows; 
    }
    if (matches.length <= 0) {
      throw Error('You are not authorized to view this task');
    }
  } catch (err) {
     return res.status(StatusCodes.BAD_REQUEST).json({msg: err.message});
  }
  next();
}