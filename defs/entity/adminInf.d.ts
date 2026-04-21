type AdminInf = {
  /** 管理ユーザーID */
  adminUserID: string;
  /** 運営区分(1：管理者、2：スタッフ) */
  adminFlg: string;
  /** 有効区分(True：有効、False：無効) */
  adminIsValid: boolean;
  /** 最終更新日 */
  lastUpdDate: string;
}

export default AdminInf;
