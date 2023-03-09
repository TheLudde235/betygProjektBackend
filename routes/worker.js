import { IRegisterWorker, isEmail, isPhonenumber } from "../services/validation.js";
import { StatusCodes } from "http-status-codes";
import {v4 as uuidV4} from 'uuid';
import { cockDB } from "../index.js";
import { sendMail } from "../services/mailer.js";
import { getUpdateQuery } from "../helpers/update.js";
import { getError } from "../services/betterErrors.js";

export const registerWorker = async (req, res) => {
  try {
    await IRegisterWorker.validateAsync(req.body);
  } catch (err) {
    res.status(StatusCodes.BAD_REQUEST);
    return res.json({msg: err.message});
  }

  const { email, firstname, lastname } = req.body;
  const phone = req.body.phone.replace(/\+\d{2}/, '0').replaceAll(' ', '');
  const skills = req.body.skills ?? '';
  const image = req.body.image ?? '';

  try {
    const uuid = uuidV4().split('-')[1];
    const registeredWorker = (await cockDB.query('select email, phone from workers where email=$1 or phone=$2', [email, phone])).rows[0];
    if (registeredWorker) {
      if (registeredWorker.email == email) {
        if (registeredWorker.phone == phone) {
          return res.status(StatusCodes.BAD_REQUEST).json({msg: 'email and phone are occupied'});
        }
        return res.status(StatusCodes.BAD_REQUEST).json({msg: 'email is occupied'});
      } else if (registeredWorker.phone == phone) {
        return res.status(StatusCodes.BAD_REQUEST).json({msg: 'phone is occupied'});
      }
    }

    await cockDB.query('insert into tempworkers(email, firstname, lastname, phone, confirmationuuid) values ($1, $2, $3, $4, $5)', [email, firstname, lastname, phone, uuid]);
    await sendMail({
      to: email,
      subject: 'Confirm your email',
      html: `
      <h3>Type this in the browser: ${uuid}</h3>`
    });
  } catch (err) {
    return res.status(StatusCodes.BAD_REQUEST).json({msg: err.message});
  }

  res.status(StatusCodes.OK);
  return res.json({msg: 'Check email to confirm'});
};

export const updateWorker = async (req, res) => {
  try {
    req.body.phone = req.body.phone ? req.body.phone.replace(/\+\d{2}/, '0').replaceAll(' ', '') : undefined;
    
    if (req.body.email && !isEmail(req.body.email)) {
      throw Error('"email" is not a valid email');
    }
    if (req.body.phone && !isPhonenumber(req.body.phone)) {
      throw Error('"phone" is not a valid phonenumber');
    }

    const {query, values} = getUpdateQuery(['email', 'firstname', 'lastname', 'image', 'phone'], 'workers', req.body, {
      'workeruuid': res.locals.uuid
    });
    
    await cockDB.query(query, values);
    
    res.status(StatusCodes.OK).json({msg: 'updated', uuid: res.locals.tokenData.uuid});
  } catch (err) {
    res.status(StatusCodes.BAD_REQUEST).json({msg: err.message, err});
  }
}

export const getWorkers = async (req, res) => {
  try {
    const workers = (await cockDB.query('select email, firstname, lastname, workeruuid from workers')).rows;
    res.status(StatusCodes.OK).json(workers);
  } catch (err) {
    res.status(StatusCodes.BAD_REQUEST).json({msg: getError(err.message)});
  }
}

export const getWorker = async (req, res) => {
  try {
    const worker = (await cockDB.query('select email, phone, firstname, lastname from workers where workeruuid=$1', [req.params.uuid])).rows[0];
    res.status(StatusCodes.OK).json({worker});
  } catch (err) {
    res.status(StatusCodes.BAD_REQUEST).json({msg: err.message});
  }
};

export const loginWorker = async (req, res) => {
  try {
    const worker = (await cockDB.query('select email, workeruuid from workers where email=$1', [req.params.email])).rows[0];
    if (!worker) throw Error('dialog.error.no_email_found');

    const uuid = uuidV4().split('-')[1];
    const preExistingTypes = (await cockDB.query('select type from emailconfirmations where email=$1', [worker.email])).rows;
    
    preExistingTypes.forEach(type => {
      if (type == 'login'){
        res.status(StatusCodes.BAD_REQUEST).json({title: 'server.error.duplicate_confirmationkey_title', content:'server.error.duplicate_confirmationkey_content'});
      }
    })

    await cockDB.query('insert into emailconfirmations(confirmationcode, type, useruuid, email) values($1, $2, $3, $4)', [uuid, 'login', worker.workeruuid, worker.email]);
    await sendMail({
      to: worker.email,
      subject: 'Taxami Login',
      html: `
        <h3>Type this in the browser: ${uuid}</h3>`
    });
    res.status(StatusCodes.ACCEPTED).json({msg: 'check email for confirmation'});
  } catch (err) {
    return res.status(StatusCodes.BAD_REQUEST).json({msg: getError(err.message)});
  }
};

export const workerRegistered = async (req, res) => {
  try {
    const query = await cockDB.query('select email, phone from workers where email=$1 or phone=$2', [req.query.email, req.query.username])

    return res.json({msg: query.rowCount >= 1});
  } catch (err) {
    return res.status(StatusCodes.BAD_REQUEST).json({msg: 'server.error.internal_server_error', err: err.message});
  }
}