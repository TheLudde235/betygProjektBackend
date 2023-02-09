import * as dotenv from 'dotenv';
import nodemailer from 'nodemailer';

dotenv.config()

export function sendMail({subject, to, text, html}) {
  const transporter = nodemailer.createTransport({
    host: "smtp-mail.outlook.com",
    secureConnection: true,
    port: 587,
    auth: {
      user: process.env.EMAIL_USERNAME,
      pass: process.env.EMAIL_PASSWORD
    },
  });
  
  const mailOptions = {
    from: process.env.EMAIL_USERNAME,
    to,
    subject,
    text,
    html
  };
  
  transporter.sendMail(mailOptions, (error, info) =>{
    if(error) console.error(error)
    else console.log(info)
  });
}
