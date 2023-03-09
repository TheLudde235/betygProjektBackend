import { cockDB } from "../index.js";
import { StatusCodes } from "http-status-codes";
import { sendMail } from "../services/mailer.js";
import { v4 } from "uuid";
import { getError } from "../services/betterErrors.js";


export const addWorker = async (req, res) => {
  try {
    const alreadyInvited = (await cockDB.query('select type from emailconfirmations where useruuid=$1 and information=$2 and type=$3', [req.body.worker, req.params.estateuuid, 'acceptinvite'])).rowCount > 0;
    if (alreadyInvited) {
      throw Error('server.error.already_invited');
    }
    const [addressObject, emailObject] = await Promise.all([
      cockDB.query('select city, street, streetnumber from estates where estateuuid=$1', [req.params.estateuuid]),
      cockDB.query('select email from workers where workeruuid=$1', [req.body.worker])
    ]);
    const { city, street, streetnumber } = addressObject.rows[0];
    const { email } = emailObject.rows[0];
    const uuid = v4().split('-')[1];


    await cockDB.query('insert into emailconfirmations(type, information, useruuid, email, confirmationcode) values ($1, $2, $3, $4, $5)', ['acceptinvite', req.params.estateuuid, req.body.worker, email, uuid]);

    await sendMail({
      to: email,
      subject: `You've been invited by ${res.locals.tokenData.username}`,
      html: ` You've been invited by ${res.locals.tokenData.username} to help at ${street} ${streetnumber}, ${city}<br>
              Accept it in the app or manually accept with the code: ${uuid} `
    });

    res.status(StatusCodes.ACCEPTED).json({ msg: 'added succesfully' });
  } catch (err) {
    res.status(StatusCodes.BAD_REQUEST).json({ msg: err.message });
  }
};

export const getInvites = async (req, res) => {
  try {
    const invites = (await cockDB.query('select confirmationcode, information from emailconfirmations where useruuid=$1 and type=$2', [res.locals.tokenData.uuid, 'acceptinvite'])).rows;
    console.log({invites, uuid: res.locals.tokenData})
    return res.status(StatusCodes.ACCEPTED).json(invites);
  } catch (err) {
    return res.status(StatusCodes.BAD_REQUEST).json({msg: getError(err.message)});
  }
}

export const getWorkersFromEstate = async (req, res) => {
  try {
    const workers = (await cockDB.query('select email, firstname, lastname, workeruuid from workers where workeruuid in (select workeruuid from estate_worker_relations where estateuuid=$1)', [req.params.estateuuid])).rows;
    return res.status(StatusCodes.OK).json(workers);
  } catch (err) {
    return res.status(StatusCodes.BAD_REQUEST).json({msg: getError(err.message)});
  }
}

export const removeWorker = async (req, res) => {
  try {
    const token = res.locals.tokenData;
    if (token.admin) {
      await cockDB.query('delete from estate_worker_relations where estateuuid=$1 and workeruuid=$2', [req.params.estateuuid, req.params.workeruuid]);
    } else {
      await cockDB.query('delete from estate_worker_relations where estateuuid=$1 and workeruuid=$2', [req.params.estateuuid, token.uuid]);
    }
    res.status(StatusCodes.ACCEPTED).json({ msg: 'removed succesfully' });
  } catch (err) {
    res.status(StatusCodes.BAD_REQUEST).json({ msg: err.message });
  }
};