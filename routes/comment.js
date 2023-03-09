import { StatusCodes } from "http-status-codes";
import { cockDB } from "../index.js";
import { v1time } from "../helpers/uuid-time.js";

export const createComment = async (req, res) => {
  const { text } = req.body;

  if (!text) {
    return res.status(StatusCodes.BAD_REQUEST).json({msg: 'no text in body'});
  }

  const taskuuid = req.params.taskuuid;

  try {
    await cockDB.query('insert into comments(taskuuid, text, admin, useruuid) values($1, $2, $3, $4)', [taskuuid, text, res.locals.tokenData.admin, res.locals.tokenData.uuid]);
    return res.status(StatusCodes.ACCEPTED).json({msg: 'comment uploaded'});
  } catch (err) {
    res.status(StatusCodes.BAD_REQUEST).json({msg: err.message});
  }
};

export const deleteComment = async (req, res) => {
  try {
    await cockDB.query('delete from comments where commentuuid=$1 and useruuid=$2', [req.params.commentuuid, res.locals.tokenData.uuid]);
    res.status(StatusCodes.ACCEPTED).json({msg: 'comment deleted'});
  } catch (err) {
    res.status(StatusCodes.BAD_REQUEST).json({msg: err.message});
  }
};

export const getComments = async (req, res) => {
  try {
    let comments = (await cockDB.query('select * from comments where taskuuid=$1', [req.params.taskuuid])).rows;
    const task = (await cockDB.query('select * from tasks where taskuuid=$1', [req.params.taskuuid])).rows[0];

    comments = await Promise.all(comments.map(async comment => {
      if (comment.admin) {
        comment.user = (await cockDB.query('select username from administrators where adminuuid=$1', [comment.useruuid])).rows[0];
      } else {
        comment.user = (await cockDB.query('select firstname, lastname from workers where workeruuid=$1', [comment.useruuid])).rows[0];
      }
      return comment;
    }));

    comments.sort((a, b) => v1time(a.commentuuid) - v1time(b.commentuuid));
    return res.status(StatusCodes.ACCEPTED).json({comments, task});
  } catch (err) {
    return res.status(StatusCodes.BAD_REQUEST).json({msg: err.message});
  }
}