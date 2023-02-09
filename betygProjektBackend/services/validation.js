import Joi from 'joi';

export const IRegisterUser = Joi.object({
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

export const IRegisterWorker = Joi.object({
  email: Joi.string()
    .email()
    .required(),

  name: Joi.object({
    first: Joi.string().required(),
    last: Joi.string().required()
  }).required(),

  phone: Joi.string()
})