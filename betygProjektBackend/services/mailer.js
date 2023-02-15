import * as dotenv from 'dotenv';
import nodemailer from 'nodemailer';

dotenv.config()

export async function sendMail({subject, to, text, html}) {
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
  
  return await transporter.sendMail(mailOptions);
}