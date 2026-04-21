/* tslint:disable */
/* eslint-disable */
declare module "node-config-ts" {
  interface IConfig {
    clientHost: string
    expressPort: number
    https: boolean
    cloudMode: boolean
    logger: Logger
    mail: Mail
    db: Db
    aws: Aws
  }
  interface Aws {
    ses: Ses
  }
  interface Ses {
    region: string
    accessKeyId: string
    secretAccessKey: string
  }
  interface Db {
    dbServers: string[]
    dbName: string
    user: string
    password: string
  }
  interface Mail {
    senderAddress: string
    smtpAccount: string
    mailPassword: string
    smtpServer: string
  }
  interface Logger {
    level: string
    logConfig: LogConfig
  }
  interface LogConfig {
    appenders: Appenders
    categories: Categories
  }
  interface Categories {
    default: Default
  }
  interface Default {
    appenders: string[]
    level: string
  }
  interface Appenders {
    out: Out
  }
  interface Out {
    type: string
    layout: Layout
  }
  interface Layout {
    type: string
    pattern: string
  }
  export const config: Config
  export type Config = IConfig
}
