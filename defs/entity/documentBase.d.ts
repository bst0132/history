import type { ObjectId } from 'mongodb';
// 各エンティティ共通項目を定義
interface DocumentBase {
  /** mongoDBが自動で払いだすID */
  _id?: ObjectId;
  /** ドキュメント有効区分(True：有効、False：無効) */
  docIsValid: boolean;
  /** ドキュメント作成ユーザーID */
  docCreUserID: string;
  /** ドキュメント作成日 */
  docCreTimeStamp: string;
  /** ドキュメント更新ユーザーID */
  docModUserID: string;
  /** ドキュメント更新日 */
  docModTimeStamp: string;

}
export default DocumentBase;
