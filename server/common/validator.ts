import logger, { stringifyAndExcludeImage } from './logger';
import * as express from 'express';

type ValidateDef = validatePrimitive
| ValidateSetting[]
| ValidateSetting;

type validatePrimitive = {
  type: 'string' | 'number' | 'boolean';
  pattern?: RegExp;
  length?: number;
};

export type ValidateSetting = {
  [key: string]: ValidateDef;
};

/**
 * 単一要素(非配列)・複数プロパティを持つ配列用
 * validateSettingに渡したチェック用の構造を元にdataのチェックを行う
 * 任意項目については別途チェックさせること
 * @param data
 * @param validateSetting
 */
const Validator = (data: object, validateSetting: ValidateSetting, req: express.Request, firstCallFlg: boolean = true): void => {

  let startTime: number;
  let userId: string;

  // 最初の呼び出し時のみログを出力(再帰的に呼び出したときは出力しない)
  if(firstCallFlg) {
    // 処理開始時刻
    startTime = Date.now();
    // ユーザーID(未ログイン等ユーザーIDが無い場合はGuestとする)
    userId = req.body?.loginInfo?.userId ?? 'Guest';
    // JSON文字列のデータ
    const strData = stringifyAndExcludeImage(data);
    // アプリケーションログ出力
    logger.appLogger.info(`Validation Start: path=${req.originalUrl}, userId=${userId}, ip=${req.ip}, data=${strData}`);
  }

  // チェック対象の値のみチェックする
  for(const key in validateSetting) {
    const value = data[key];
    const valueType = typeof value;
    if (valueType == 'object') {
      const setting = validateSetting[key];
      // object判定でもArrayのパターンもあるので改めて判定
      if (Array.isArray(setting)) {
        // 配列の場合、要素数１以上の配列かチェック
        if(value && value.length > 0) {
          for(let i = 0; i < value.length; i++) {
            // 再帰的にバリデーターを呼び出す
            Validator(value[i], setting[0], req, false);
          }
        } else {
          throw new Error(`${key} is empty Array !`);
        }
      } else {
        // 再帰的にバリデーターを呼び出す
        Validator(value, setting as ValidateSetting, req, false);
      }
    } else {
      const setting = validateSetting[key] as validatePrimitive;
      // 空文字はここで弾く
      if(!value && !(value === 0) && !(setting.type === 'boolean')) {
        throw new Error(`${key} is empty!`);
      }
      // チェックする型と一致しているか確認
      // 未設定の場合もここで弾かれる
      if (valueType != setting.type) {
        throw new Error(`${key} is not match Type !`);
      }
      if (setting.pattern && !setting.pattern.test(value)) {
        // 正規表現チェック
        throw new Error(`${key} is not match Pattern !`);
      }
      if (setting.length && setting.length < value.length){
        // 文字数制限チェック
        throw new Error(`${key} is not the right number of characters !`);
      }
    }
  }

  // 最初の呼び出し時のみログを出力(再帰的に呼び出したときは出力しない)
  if(firstCallFlg) {
    // 処理終了時刻
    const duration = Date.now() - startTime;
    // アプリケーションログ出力
    logger.appLogger.info(`Validation End: path=${req.originalUrl}, userId=${userId}, ip=${req.ip}, time=${duration}ms`);
  }
};

/**
 * 配列用バリデーション(プロパティが1つの配列限定・複数プロパティがある場合は使用不可)
 */
export const ArrayValidator = (data: object, validateSetting: ValidateSetting, req: express.Request): void => {
  // 処理開始時刻
  const startTime = Date.now();
  // ユーザーID(未ログイン等ユーザーIDが無い場合はGuestとする)
  const userId = req.body?.loginInfo?.userId ?? 'Guest';
  // JSON文字列のデータ
  const strData = stringifyAndExcludeImage(data);
  // アプリケーションログ出力
  logger.appLogger.info(`Validation Start: path=${req.originalUrl}, userId=${userId}, ip=${req.ip}, data=${strData}`);

  // バリデーションチェックの対象項目
  type validatePrimitive = {
    type: 'string';
    length: number;
  };

  // チェック対象のキーの数だけ繰り返す
  for (const key in validateSetting) {
    const value = data[key];
    const setting = validateSetting[key] as validatePrimitive;
    // 配列の要素ごとにチェックを行う
    value.forEach(elm => {
      const valueType = typeof elm;
      // 空文字判定
      if (!elm && elm !== 0) {
        throw new Error(`${key} includes an empty value!`);
      }
      // 型判定
      if (valueType != setting.type) {
        throw new Error(`${key} includes a value of invalid type!`);
      }
      // 文字数判定
      if (setting.length && setting.length < elm.length) {
        throw new Error(`${key} includes a value of invalid number of characters !`);
      }
    });
  }

  // 処理終了時刻
  const duration = Date.now() - startTime;
  // アプリケーションログ出力
  logger.appLogger.info(`Validation End: path=${req.originalUrl}, userId=${userId}, ip=${req.ip}, time=${duration}ms`);
};

export default Validator;
