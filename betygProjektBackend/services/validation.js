import Joi from 'joi';

// Users

export const isEmail = (email) => !Joi.string().email().required().validate(email).error;
export const isAlphaNumberic = (str) => !Joi.string().alphanum().required().validate(str).error;
export const isPhonenumber = (number) => !Joi.string().regex(/^(?:\+?(\d{1,3}))?[-\s. (]*(\d{3})[-. )]*(\d{3})[-. ]*(\d{4}|(\d{2}\s\d{2}))(?: *x(\d+))?$/).required().validate(number).error;

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

export const ITask = Joi.object({
  title: Joi.string()
    .max(50)
    .required(),
  
    description: Joi.string()
      .required(),
    
    estateuuid: Joi.string()
      .uuid({version: 'uuidv4'})
      .required()
});
