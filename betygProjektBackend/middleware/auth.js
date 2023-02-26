import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
import { StatusCodes } from 'http-status-codes';
import { cockDB } from '../index.js';
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
    next();
  } catch (err) {
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({msg: err.message});
  }
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
    next();
  } catch (err) {
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({msg: err.message});
  }
};

export function userAuth(req, res, next) {
  if (!req.headers.authorization) {
    return res.status(StatusCodes.BAD_REQUEST).json({msg: 'No credentials sent'});
  }

  try {
    const { authorization } = req.headers;

    const token = authorization.split(' ')[1];

    res.locals.tokenData = jwt.verify(token, process.env.JWT_SECRET);
    next();

  } catch (err) {
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({msg: err.message});
  }
};

export async function estateAuth(req, res, next) {
  const uuid = res.locals.tokenData.uuid ?? res.locals.tokenData.admin;

  try {
    if (res.locals.tokenData.admin) {
      const matches = (await cockDB.query('select adminuuid from estates where adminuuid=$1 and estateuuid=$2', [uuid, req.params.estateuuid])).rows;
      if (matches.length <= 0) {
        return res.status(StatusCodes.NOT_ACCEPTABLE).json({msg: 'You are not authorized to view comments for estate' + req.params.estateuuid});
      }
    } else {
      const matches = (await cockDB.query('select workeruuid')) 
    } 
  } catch (err) {

  }
  next();
}