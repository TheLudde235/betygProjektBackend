import { ILoginUser, IRegisterUser, isAlphaNumberic, isEmail } from '../services/validation.js';
import { v4 as uuidV4 } from 'uuid';
import { cookieOptions } from '../helpers/cookie.js';
import { StatusCodes } from 'http-status-codes';
import bcrypt from 'bcryptjs';
import { dbClient, salt } from '../index.js';
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
    const alreadyExists = (await dbClient.query('select username, email from administrators where username=$1 or email=$2', [username, email]));
    if (alreadyExists.length > 0) {
      switch (true) {
        case alreadyExists.length > 1:
          return res.status(StatusCodes.BAD_REQUEST).json({msg: 'server.error.email_and_username_occupied'});
        case alreadyExists[0].username == username:
          return res.status(StatusCodes.BAD_REQUEST).json({msg: 'server.error.username_occupied'});
        case alreadyExists[0].email == email:
          return res.status(StatusCodes.BAD_REQUEST).json({msg: 'server.error.email_occupied'});
      }
    }
    await dbClient.query('insert into emailconfirmations (type, useruuid, confirmationcode, email, information) values ($1, $2, $3, $4, $5)', ['adminregister', uuid, code, email, JSON.stringify({uuid, username: username.trim(), password: await bcrypt.hash(password, salt), email})]);
    await sendMail({
      to: email,
      subject: 'Taxami Registration',
      html: `
        <h3>Type this in the browser: ${code}</h3>`
    });
    return res.status(StatusCodes.ACCEPTED).json({msg: 'server.message.check_email'})
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
    const user = (await dbClient.query('select password, adminuuid, email from administrators where username=$1', [username])).rows[0];
    if (!await bcrypt.compare(password, user.password)) {
      throw Error('server.error.wrong_username_or_password');
    }
    const token = await getAdminToken({username, email: user.email, uuid: user.adminuuid});
    return res.status(StatusCodes.OK).json({msg: 'server.message.logged_in', token});
  } catch(err) {
    return res.status(StatusCodes.UNAUTHORIZED).json({msg: 'server.error.wrong_username_or_password'});
  }
};

export const getAdmin = async (req, res) => {
  try {
    const admin = (await dbClient.query('select username, email, adminuuid from administrators where adminuuid=$1', [req.params.uuid])).rows[0];
    res.status(StatusCodes.ACCEPTED).json({admin});
  } catch (err) {
    res.status(StatusCodes.BAD_REQUEST).json({msg: 'server.error.cannot_get_admin', err: err.message});
  }
};

export const putAdmin = async (req, res) => {
  try {
    const email = req.body.email;
    const username = req.body.username ? req.body.username.trim() : false;

    if (email && !isEmail(email)) {
      throw Error('server.error.email_invalid');
    }
    if (username && !isAlphaNumberic(username)) {
      throw Error('server.error.username_not_alphanumeric');
    }
    
    const {query, values} = getUpdateQuery(['email', 'username'], 'administrators', req.body, {
      'adminuuid': res.locals.tokenData.uuid
    });
    await dbClient.query(query, values);

    return res.status(StatusCodes.ACCEPTED).json({msg: 'server.message.updated_profile', uuid: res.locals.tokenData.uuid})
  } catch (err) {
    res.status(StatusCodes.BAD_REQUEST).json({msg: 'server.error.cannot_update_admin', err: err.message});
  }
};

export const adminRegistered = async (req, res) => {
  try {
    const queries = (await Promise.all([
      dbClient.query('select username from administrators where email=$1 or username=$2', [req.query.email, req.query.username]),
      dbClient.query('select email from emailconfirmations where email=$1', [req.query.email])
    ]));
    const registered = queries[0].rowCount > 0 || queries[1].rowCount > 0;
    return res.json({msg: registered});
  } catch (err) {
    return res.status(StatusCodes.BAD_REQUEST).json({msg: 'server.error.internal_server_error', err: err.message});
  }
}