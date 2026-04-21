import { Component, OnInit } from '@angular/core';
import { CommonService } from 'client/app/common/common.service';
import { CompetitionForCompList, OrganInfo, TeamInfo } from 'defs/api';
import { CNS } from 'client/app/common/defines';

@Component({
  selector: 'app-manage-comp-list',
  templateUrl: './manage-comp-list.component.html',
  styleUrls: ['./manage-comp-list.component.scss']
})
export class ManageCompListComponent implements OnInit {

  compList: CompetitionForCompList[];

  organList: OrganInfo[];

  teamList: TeamInfo[];

  /**
   * コンストラクタ
   * @param commonService
   */
  constructor(private commonService: CommonService) {}

  /**
   * 初期処理
   */
  public async ngOnInit(): Promise<void> {

    try {
      // 管理大会取得処理
      const res = await this.commonService.apiPost('user/manageCompList', {}).toPromise();

      // 取得結果の設定
      this.compList = res.compList;
      this.organList = res.organList;
      this.teamList = res.teamList;

    } catch(e) {
      this.commonService.errorOnApi(e);
      this.commonService.navigateBack();
    }
  }

  /**
   * 大会パネルから大会編集に遷移する
   * @param comp
   */
  public navigateManageComp(comp: CompetitionForCompList): void {
    this.commonService.navigateWithEdit(CNS.pathToManageCompetition, {
        id: comp.compID,
        type: 'competition'
    });
  }

  /**
   * 主催団体名を取得する
   * @param organID
   */
  public getOrganizerName(organID: string): string {

    // チーム情報から主催団体を検索する
    const findRsltTeam = this.teamList.find((team) => {
      return team.teamID.toString() == organID;
    });

    // 検索結果がある場合、チーム名を返却する
    if(findRsltTeam) {
      return findRsltTeam.teamName;

    } else {
      // 団体情報から主催団体を検索する
      const findRsltOrgan = this.organList.find((organ) => {
        return organ.organID.toString() == organID;
      });

      // 検索結果がある場合、団体名を返却し、無い場合は空文字を返却
      if(findRsltOrgan) {
        return findRsltOrgan.organName;

      } else {
        return '';
      }
    }
  }

  /**
   * Enterキー・スペースキー押下時にクリックイベント発火
   */
  public onKeyCheck(value: KeyboardEvent): void {
    this.commonService.onKeyCheck(value);
  }
}
