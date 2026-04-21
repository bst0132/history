import { Component, Inject, OnInit } from '@angular/core';
import { MAT_LEGACY_DIALOG_DATA as MAT_DIALOG_DATA, MatLegacyDialogRef as MatDialogRef } from '@angular/material/legacy-dialog';
import { CommonService } from 'client/app/common/common.service';
import { CNS } from 'client/app/common/defines';
import { OrganForTmOrgList, TeamForTmOrgList } from 'defs/api';

export interface ManageOrgDialogData {
  idList: string[];
}

@Component({
  selector: 'app-select-manage-org-tm-dialog',
  templateUrl: './select-manage-org-tm-dialog.component.html',
  styleUrls: ['./select-manage-org-tm-dialog.component.scss']
})
export class SelectManageOrgTmDialogComponent implements OnInit{

  // 管理団体格納用
  organList: OrganForTmOrgList[];

  // 管理チーム格納用
  teamList: TeamForTmOrgList[];

  // 追加可能管理団体格納用
  addOrganList: OrganForTmOrgList[];

  // 追加可能管理チーム格納用
  addTeamList: TeamForTmOrgList[];

  // 追加済み管理団体格納用
  addedOrganList: OrganForTmOrgList[];

  // 追加済み管理チーム格納用
  addedTeamList: TeamForTmOrgList[];

  // デバイス判定用変数
  device: 'pc' | 'sp';

  /**
   * コンストラクタ
   */
  constructor(@Inject(MAT_DIALOG_DATA) public data: ManageOrgDialogData, public commonService: CommonService,
  private dialogRef: MatDialogRef<SelectManageOrgTmDialogComponent>) {
    // マスク部分押下でのクローズを制御
    dialogRef.disableClose = true;

    // デバイス判定
    this.device = commonService.isMobile ? 'sp' : 'pc';
  }

  /**
   * 初期処理
   */
  public async ngOnInit(): Promise<void> {
    // ログイン情報の取得
    const data = this.commonService.getLoginInfo();

    try {
      // 管理団体/チーム取得処理
      const res = await this.commonService.apiPost('user/manageTmOrgList', data).toPromise();

      // 取得結果の設定
      this.organList = res.organList;
      this.teamList = res.teamList;

      // 追加可能管理団体を抽出
      this.addOrganList = this.organList.filter(elm =>
        this.data.idList.every(id => elm.organID.toString() != id)
      );

      // 追加可能管理チームを抽出
      this.addTeamList = this.teamList.filter(elm =>
        this.data.idList.every(id => elm.teamID.toString() != id)
      );

      // 追加済み管理団体を抽出
      this.addedOrganList = this.organList.filter(elm =>
        this.data.idList.some(id => elm.organID.toString() == id)
      );

      // 追加済み管理チームを抽出
      this.addedTeamList = this.teamList.filter(elm =>
        this.data.idList.some(id => elm.teamID.toString() == id)
      );

    } catch(e) {
      await this.commonService.errorOnService(CNS.targetTypeOrg + 'または' + CNS.targetTypeTeam, CNS.actionTypeGet);

      // ダイアログを閉じる
      this.dialogRef.close();
    }
  }

  /**
   * 団体選択/ダイアログ終了処理
   */
  public onClickOrg(organ: OrganForTmOrgList): void {
    // 返却情報設定
    const addData = {
      organId: organ.organID,
      organName: organ.organName,
      isOrgFlg: '1'
    };

    // ダイアログを閉じる
    this.dialogRef.close(addData);
  }

  /**
   * チーム選択/ダイアログ終了処理
   */
  public onClickTeam(team: TeamForTmOrgList): void {
    // 返却情報設定
    const addData = {
      organId: team.teamID,
      organName: team.teamName,
      isOrgFlg: '2'
    };

    // ダイアログを閉じる
    this.dialogRef.close(addData);
  }

  /**
   * Enterキー・スペースキー押下時にクリックイベント発火
   */
  public onKeyCheck(value: KeyboardEvent): void {
    this.commonService.onKeyCheck(value);
  }
}
