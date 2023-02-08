import Joi from 'joi';

export const IUser = Joi.object({
  username: Joi.string()
    .alphanum()
    .min(3)
    .max(30)
    .required(),
  
  password: Joi.string()
    .min(3)
    .required(),

  email: Joi.string()
    .email()
    .required(),
})

export const IWorker = Joi.object({
  name: Joi.string()
    .alphanum()
    .required(),

  email: Joi.string()
    .email()
    .required()
})