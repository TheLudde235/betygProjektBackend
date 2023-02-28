import { cockDB } from "../index.js";
import { StatusCodes } from "http-status-codes";
import { sendMail } from "../services/mailer.js";
import { v4 } from "uuid";


export const addWorker = async (req, res) => {
  try {
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
              Press the <a href="${process.env.HOST}/confirmMail/${uuid}?type=acceptinvite">Link</a> or type the code: ${uuid} in your browser`
    });

    res.status(StatusCodes.ACCEPTED).json({ msg: 'added succesfully' });
  } catch (err) {
    res.status(StatusCodes.BAD_REQUEST).json({ msg: err.message });
  }
};

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