import { cockDB } from "../index.js";
import { sendMail } from "../services/mailer.js";
import { StatusCodes } from "http-status-codes";
import { isEmail } from "../services/validation.js";
import { getAdminToken, getWorkerToken } from "../helpers/tokens.js";

export const confirmEmail = async (req, res) => {
  try {
    if (!req.query.type) {
      const tempworker = (await cockDB.query('select * from tempworkers where confirmationuuid=$1', [req.params.confirmationuuid])).rows[0];
      if (!tempworker) throw Error('code is not correct or already used');
      await cockDB.query('insert into workers(workeruuid, email, firstname, lastname, phone) values($1, $2, $3, $4, $5)', [tempworker.workeruuid, tempworker.email, tempworker.firstname, tempworker.lastname, tempworker.phone]);
      await cockDB.query('delete from tempworkers where confirmationuuid=$1', [req.params.confirmationuuid]);
      return res.status(StatusCodes.CREATED).json({
        msg: 'Sucessfully registered',
        uuid: tempworker.workeruuid,
        token: await getWorkerToken({tempworker})
      });
    }
    const user = (await cockDB.query('select * from emailconfirmations where confirmationcode=$1 and type=$2', [req.params.confirmationuuid, req.query.type])).rows[0];
    if (!user) throw Error('code is not correct or already used');
    
    await cockDB.query('delete from emailconfirmations where confirmationcode=$1 and type=$2', [user.confirmationcode, req.query.type]);

    switch (req.query.type) {
      case 'login':
        return res.status(StatusCodes.ACCEPTED).json({
          msg: 'login succesfull',
          uuid: user.useruuid,
          token: await getWorkerToken(user)
        });
      case 'acceptinvite':
        const estateuuid = user.information;
        await cockDB.query('insert into estate_worker_relations(estateuuid, workeruuid) values ($1, $2)', [estateuuid, user.useruuid]);
        return res.status(StatusCodes.ACCEPTED).json({msg: 'Added to ' + estateuuid});
      case 'adminregister':
        const {uuid, username, email, password} = JSON.parse(user.information);
        await cockDB.query('insert into administrators (adminuuid, username, email, password) values($1, $2, $3, $4)', [uuid, username, email, password]);  
        const token = await getAdminToken({username, email, uuid});
        return res.status(StatusCodes.CREATED).json({msg: 'Created Succesfully', token});
    }
        
        
  } catch (err) {
    return res.status(StatusCodes.BAD_REQUEST).json({msg: err.message});
  }
};

export const resendEmail = async (req, res) => {
  try {
    if (!isEmail(req.params.email)) throw Error('Invalid email');
    if (!req.query.type) {
      const worker = (await cockDB.query('select * from tempworkers where email=$1', [req.params.email])).rows[0];
      if (!worker) throw Error('Email could not be found');
      await sendMail({
        to: worker.email,
        subject: 'Confirm your email',
        html: `
          <h1><a href="${process.env.HOST}/confirmMail/${worker.confirmationuuid}">Click here!</a></h1>
          <h3>Or type this in the browser: ${worker.confirmationuuid}</h3>`
      });
    }

    const user = (await cockDB.query('select * from emailconfirmations where email=$1 and type=$2', [req.params.email, req.query.type])).rows[0];

    if (!user) throw Error(`Email doesn't have any pending confirmations`);

    await sendMail({
      to: user.email,
      subject: req.query.type,
      html: `
        <h1><a href="${process.env.HOST}/confirmMail/${user.confirmationcode}?type=${user.type}">Click here!</a></h1>
        <h3>Or type this in the browser: ${user.confirmationcode}</h3>`
    });
  } catch (err) {
    return res.status(StatusCodes.BAD_REQUEST).json({msg: err.message});
  }
  return res.status(StatusCodes.OK).json({msg: 'email sent'})
};