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
    .required(),

  lastname: Joi.string()
    .required(),

  email: Joi.string()
    .email()
    .required(),

  skills: Joi.string()
    .allow(null, ''),
  
  image: Joi.string()
    .allow(null, '')
    .uri(),

  phone: Joi.string()
    .regex(/^(?:\+?(\d{1,3}))?[-\s. (]*(\d{3})[-. )]*(\d{3})[-. ]*(\d{4}|(\d{2}\s\d{2}))(?: *x(\d+))?$/)
    .message('phone must be a valid phonenumber')
    .required()
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