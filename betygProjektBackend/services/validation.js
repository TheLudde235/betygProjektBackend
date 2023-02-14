import Joi from 'joi';

// Users

export const ILoginUser = Joi.object({
  username: Joi.string()
    .alphanum()
    .min(3)
    .max(30)
    .required(),
  
  password: Joi.string()
    .min(3)
    .required(),
});

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
});

export const IRegisterWorker = Joi.object({
  firstname: Joi.string()
    .alphanum()
    .required(),

  lastname: Joi.string()
    .alphanum()
    .required(),

  email: Joi.string()
    .email()
    .required(),

  skills: Joi.string()
    .required(),
  
  image: Joi.string()
    .uri(),

  phone: Joi.string()
});

// Estate

export const IEstate = Joi.object({
  city: Joi.string()
    .required(),
  
  street: Joi.string()
    .required(),
  
  streetnumber: Joi.string()
    .required(),
});