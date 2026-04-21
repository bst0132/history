import { Component, OnInit } from '@angular/core';
import { CommonService } from 'client/app/common/common.service';
import { OrganForTmOrgList, TeamForTmOrgList } from 'defs/api';
import { CNS } from 'client/app/common/defines';

@Component({
  selector: 'app-manage-tm-org-list',
  templateUrl: './manage-tm-org-list.component.html',
  styleUrls: ['./manage-tm-org-list.component.scss']
})
export class ManageTmOrgListComponent implements OnInit {

  teamList:  TeamForTmOrgList[];

  organList: OrganForTmOrgList[];

  /**
   * コンストラクタ
   * @param commonService
   */
  constructor(private commonService: CommonService) { }

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
      this.teamList = res.teamList;
      this.organList = res.organList;

    } catch(e) {
      await this.commonService.errorOnService(CNS.targetTypeTeam + 'または' + CNS.targetTypeOrg, CNS.actionTypeGet);
      this.commonService.navigateWithEdit(CNS.pathToProfileDetail);
    }

  }

  /**
   * チームパネルからチーム参照に遷移する
   * @param team
   */
  public navigateTeamDetail(team: TeamForTmOrgList): void {
    this.commonService.navigateWithEdit(CNS.pathToTeamDetail, {
        id: team.teamID,
        type: CNS.infoTypeTeam
    });
  }

  /**
   * 団体パネルから団体参照に遷移する
   * @param organ
   */
  public navigateOrganDetail(organ: OrganForTmOrgList): void {
    this.commonService.navigateWithEdit(CNS.pathToOrganDetail, {
        id: organ.organID,
        type: CNS.infoTypeOrgan
    });
  }

  /**
   * Enterキー・スペースキー押下時にクリックイベント発火
   */
  public onKeyCheck(value: KeyboardEvent): void {
    this.commonService.onKeyCheck(value);
  }
}
