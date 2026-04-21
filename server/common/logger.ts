// ログの設定を使いまわすための共通モジュール
import { getLogger, configure, Configuration } from 'log4js';
import { config } from 'node-config-ts';

// 設定オブジェクトを取得
const logConfig = config.logger.logConfig as unknown as Configuration;

// log4jsに設定を適用
configure(logConfig);

// 各カテゴリに対するロガーを取得（引数なしについてはdefaultカテゴリを取得）
// ※設定ファイル(環境名.json)に下記で指定したカテゴリが存在しない場合はdefautカテゴリが適用されてしまうため、設定ファイルでは何かしらの設定をしておく
const accessLogger = getLogger('access');
const appLogger = getLogger();
const errorLogger = getLogger('error');
const warnLogger = getLogger('warn');

// ロガーをまとめる
const logger = {
  accessLogger,
  appLogger,
  errorLogger,
  warnLogger
};

// Base64エンコードされた画像データの正規表現
const imageRegex = /(data:image\/[a-zA-Z]+;base64),[^"]+/g;

// ログに出力するデータをJSON文字列に変換し、新しい文字列を返す
// 画像データURLを含んでいる場合のみ、最初のdata:image/●●;base64の部分を残し、それ以外のBase64エンコード部分は除外する
// (画像データURLはログに出力すると膨大な量になるため)
// 画像データが含まれていない場合は、replaceは特になにも起こらない
export const stringifyAndExcludeImage = (data, isRestArray: boolean = false): string => {
  // もしdataがundefinedまたはnullなら空文字を返す
  if(data === undefined || data === null) {
    return '';
  }
  // 渡されたデータが複数の引数をまとめた配列の場合（関数呼び出し時にレスト構文で受け取った場合）
  if(isRestArray) {
    // mapで配列の各要素を処理（JSON.stringifyでJSON形式に変換とreplaceでBase64エンコード部分を除外）した結果の配列の各要素をjoinでカンマ区切りで結合して1つの文字列にする
    return data.map(item => JSON.stringify(item).replace(imageRegex, '$1')).join(',');
  }
  // 通常の処理（配列ではない・元から配列として扱うデータの場合）
  return JSON.stringify(data).replace(imageRegex, '$1');
};

export default logger;
