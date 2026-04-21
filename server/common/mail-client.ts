import { config } from 'node-config-ts';
import * as mailer from 'nodemailer';

const mailSetting = config.mail;
// メールクライアント
const transporter = mailer.createTransport({
  host: mailSetting.smtpServer,
  port: 587,
  secure: false, // SSL
  auth: {
    user: mailSetting.smtpAccount,
    pass: mailSetting.mailPassword
  },
  authMethod: 'CRAM-MD5'
});

export default transporter;
