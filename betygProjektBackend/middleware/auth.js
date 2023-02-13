import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
import { StatusCodes } from 'http-status-codes';
dotenv.config();

export function adminAuth(req, res, next) {
  if (!req.headers.authorization) {
    return res.status(StatusCodes.BAD_REQUEST).json({msg: 'No credentials sent'});
  }
  try {
    const { authorization } = req.headers;
    const token = authorization.split(' ')[1];
    const object = jwt.verify(token, process.env.JWT_SECRET);
    if (!object.admin) return res.status(StatusCodes.BAD_REQUEST).json({msg: 'User is not admin'});
    next();
  } catch (err) {
    res.json({msg: err.message});
  }
}