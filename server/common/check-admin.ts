import { AdminInf } from 'defs/entity';

// 権限チェック
const CheckAdmin = (adminInf: AdminInf[], userId: string): void => {

    const chkAdmin = adminInf.find(admin => {
      return admin.adminUserID == userId;
    });

    if (!chkAdmin) {
      // 管理者以外による編集の場合
      throw new Error('unauthorized user tried to edit information !');
    }

};
export default CheckAdmin;
