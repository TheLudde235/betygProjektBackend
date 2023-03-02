import { ILoginUser, IRegisterUser, isAlphaNumberic, isEmail } from '../services/validation.js';
import { v4 as uuidV4 } from 'uuid';
import { cookieOptions } from '../helpers/cookie.js';
import { StatusCodes } from 'http-status-codes';
import bcrypt from 'bcryptjs';
import { cockDB, salt } from '../index.js';
import { getUpdateQuery } from '../helpers/update.js';
import { getAdminToken } from '../helpers/tokens.js';
import { sendMail } from '../services/mailer.js';

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
    const code = uuidV4().split('-')[1];
    await cockDB.query('insert into emailconfirmations (type, useruuid, confirmationcode, email, information) values ($1, $2, $3, $4, $5)', ['adminregister', uuid, code, email, JSON.stringify({uuid, username: username.trim(), password, email})]);
    await sendMail({
      to: email,
      subject: 'Taxami Registration',
      html: `
        <h1><a href="${process.env.HOST}/adminconfirmation/${code}">Click here!</a></h1>
        <h3>Or type this in the browser: ${code}</h3>`
    });
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
    const user = (await cockDB.query('select password, adminuuid, email from administrators where username=$1', [username])).rows[0];
    if (!await bcrypt.compare(password, user.password)) {
      throw Error('bad username or password');
    }
    const token = await getAdminToken({username, email: user.email, uuid: user.adminuuid});
    res.cookie('token', token, cookieOptions);
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
    
    const {query, values} = getUpdateQuery(['email', 'username'], 'administrators', req.body, {
      'adminuuid': res.locals.tokenData.uuid
    });
    await cockDB.query(query, values);

    return res.status(StatusCodes.ACCEPTED).json({msg: 'Profile updated', uuid: res.locals.tokenData.uuid})
  } catch (err) {
    res.status(StatusCodes.BAD_REQUEST).json({msg: err.message});
  }
};

export const adminRegistered = async (req, res) => {
  try {
    return res.json({msg: (await cockDB.query('select username from administrators where email=$1 or username=$2', [req.query.email, req.query.username])).rows});
  } catch (err) {
    return res.status(StatusCodes.BAD_REQUEST).json({msg: err});
  }
}