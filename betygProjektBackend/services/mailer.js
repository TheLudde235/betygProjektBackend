import * as dotenv from 'dotenv';
import nodemailer from 'nodemailer';

dotenv.config()

export function sendMail({subject, to, text, html}) {
  const transporter = nodemailer.createTransport({
    service: 'gmail',
    host: 'smtp.gmail.com',
    secureConnection: true,
    port: 587,
    auth: {
      user: process.env.GMAIL_USERNAME,
      pass: process.env.APP_PASSWORD
    },
  });
  
  const mailOptions = {
    from: process.env.GMAIL_USERNAME,
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
