import { IRegisterWorker, isEmail, isPhonenumber } from "../services/validation.js";
import { StatusCodes } from "http-status-codes";
import {v4 as uuidV4} from 'uuid';
import { cockDB } from "../index.js";
import { sendMail } from "../services/mailer.js";
import { getUpdateQuery } from "../helpers/update.js";

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

    await cockDB.query('insert into tempworkers(email, firstname, lastname, phone, skills, image, confirmationuuid) values ($1, $2, $3, $4, $5, $6, $7)', [email, firstname, lastname, phone, skills, image, uuid]);
    await sendMail({
      to: email,
      subject: 'Confirm your email',
      html: `
      <h1><a href="${process.env.HOST}/confirmMail/${uuid}">Click Here!</a></h1>
      <h3>Or type this in the browser: ${uuid}</h3>`
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
    if (!worker) throw Error(`${req.params.email} does not exits in database`);

    const uuid = uuidV4().split('-')[1];
    await cockDB.query('insert into emailconfirmations(confirmationcode, type, useruuid, email) values($1, $2, $3, $4)', [uuid, 'login', worker.workeruuid, worker.email]);
    await sendMail({
      to: worker.email,
      subject: 'Taxami Login',
      html: `
        <h1><a href="${process.env.HOST}/confirmMail/${uuid}">Click here!</a></h1>
        <h3>Or type this in the browser: ${uuid}</h3>`
    });
    res.status(StatusCodes.ACCEPTED).json({msg: 'check email for confirmation'});
  } catch (err) {
    return res.status(StatusCodes.BAD_REQUEST).json({msg: err.message});
  }
};