import { ILoginUser, IRegisterUser, isAlphaNumberic, isEmail } from '../services/validation.js';
import { v4 as uuidV4 } from 'uuid';
import { cookieOptions } from '../helpers/cookie.js';
import { StatusCodes } from 'http-status-codes';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { cockDB, salt } from '../index.js';
import { getUpdateQuery } from '../helpers/update.js';

export const register = async (req, res) => {
  try {
    await IRegisterUser.validateAsync(req.body);
  } catch (err) {
    res.status(StatusCodes.BAD_REQUEST);
    return res.json({msg: err.message});
  }

  const { username, password, email} = req.body;

  try {
    const uuid = uuidV4();
    await cockDB.query('insert into administrators (adminuuid, username, email, password) values($1, $2, $3, $4)', [uuid, username.trim(), email, await bcrypt.hash(password, salt)]);  
    const token = jwt.sign({username: username.trim(), admin: uuid}, process.env.JWT_SECRET, {expiresIn: '1h'});
    res.cookie('token', token, cookieOptions);
    res.status(StatusCodes.CREATED);
    return res.json({msg: 'Created Succesfully', token});
  } catch (err) {
    res.status(StatusCodes.BAD_REQUEST);
    return res.json({msg: err.message});
  }
};

export const login = async (req, res) => {
  try {
    await ILoginUser.validateAsync(req.body);
  } catch (err) {
    return res.status(StatusCodes.BAD_REQUEST).json({msg: err.message});
  }

  const {username, password} = req.body;
  
  try {
    const user = (await cockDB.query('select password, adminuuid from administrators where username=$1', [username])).rows[0];
    if (!await bcrypt.compare(password, user.password)) {
      throw Error('bad username or password');
    }
    const token = jwt.sign({username, admin: user.adminuuid}, process.env.JWT_SECRET, {expiresIn: '1h'});
    res.setHeader('token', token);
    return res.status(StatusCodes.OK).json({msg: 'logged in', token});
  } catch(err) {
    return res.status(StatusCodes.UNAUTHORIZED).json({msg: 'bad username or password'});
  }
};

export const getAdmin = async (req, res) => {
  try {
    const admin = (await cockDB.query('select username, email, adminuuid from administrators where adminuuid=$1', [req.params.uuid])).rows[0];
    res.status(StatusCodes.ACCEPTED).json({admin});
  } catch (err) {
    res.status(StatusCodes.BAD_REQUEST).json({msg: err.message});
  }
};

export const putAdmin = async (req, res) => {
  try {
    const email = req.body.email;
    const username = req.body.username ? req.body.username.trim() : false;

    if (email && !isEmail(email)) {
      throw Error('Email is not valid');
    }
    if (username && !isAlphaNumberic(username)) {
      throw Error('Username is not alphanumeric');
    }
    
    const {query, values} = getUpdateQuery(['email', 'username'], 'adminstrators', req.body, {
      'adminuuid': res.locals.tokenData.admin
    });
    await cockDB.query(query, values);

    return res.status(StatusCodes.ACCEPTED).json({msg: 'Profile updated', uuid: res.locals.tokenData.admin})
  } catch (err) {
    res.status(StatusCodes.BAD_REQUEST).json({msg: err.message});
  }
};