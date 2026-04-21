import * as aws from 'aws-sdk';
import { config } from 'node-config-ts';
import { CommonConst } from './constants';
import logger from './logger';

// メール送信専用のIAMユーザーの情報を設定する
aws.config.update({
  region: config.aws.ses.region,
  credentials: {
    accessKeyId: config.aws.ses.accessKeyId,
    secretAccessKey: config.aws.ses.secretAccessKey
  }
});

/**
 * AWS SESからメール送信を行う関数
 * @param toAdd 送信先
 * @param sub 題名
 * @param text 本文
 */
const sendMail = async (toAdd: string, sub: string, text: string): Promise<void> => {

  // メール送信時の情報を設定
  const mailSetting: aws.SES.SendEmailRequest = {
    Destination: {
      ToAddresses: [toAdd]
    },
    Message: {
      Body: {
        Text: {
          Charset: CommonConst.CHARSET,
          Data: text
        }
      },
      Subject: {
        Charset: CommonConst.CHARSET,
        Data: sub
      }
    },
    Source: config.mail.senderAddress
  };

  // メール送信を行い処理結果を受け取る
  const result = await new aws.SES({apiVersion: '2010-12-01'}).sendEmail(mailSetting).promise();

  // 送信時の処理結果でエラーがあれば出力する
  if (result.$response.error) {
    logger.errorLogger.error(result.$response.error);
  }

};

export default sendMail;
