import dotenv from "dotenv";
dotenv.config();

import nodemailer from "nodemailer";


console.log("PASS LENGTH:", process.env.EMAIL_PASS?.length);

const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 587,
  secure: false,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
  connectionTimeout:20000,
  greetingTimeout:20000,
  socketTimeout:30000,
});

const sendMail = async (to, subject, text) => {
  await transporter.sendMail({
    from: process.env.EMAIL_USER,
    to,
    subject,
    text,
  });
};

export default sendMail;