import { Component } from '@angular/core';
import { UntypedFormGroup, UntypedFormBuilder, Validators } from '@angular/forms';
import { CommonService } from '../../../common/common.service';
import { CNS, prefectures, sports } from '../../../common/defines';
import { MSG } from '../../../common/message-defines';
import { TeamForTmOrgList } from 'defs/api';

@Component({
  selector: 'app-team-list',
  templateUrl: './team-list.component.html',
  styleUrls: ['./team-list.component.scss']
})
export class TeamListComponent {

  teamList: TeamForTmOrgList[];

  teamsCnt: number; // チーム数カウント用変数

  formGroup: UntypedFormGroup;

  sports = sports;

  prefectures = prefectures; // 47都道府県格納用

  msg = MSG;

  searchFlg = false; // 検索ボタン押下判定用

  constructor(private commonService: CommonService, private formBuilder: UntypedFormBuilder) {
    this.formGroup = formBuilder.group({
      teamName: ['', Validators.maxLength(50)],
      sports: [sports[0].key, Validators.required],
      teamPrefecture: ['', Validators.required]
    });
  }

  async onSearch(): Promise<void> {
    const data = this.formGroup.value;

    try {
      const res = await this.commonService.apiPost('team/teamList', data).toPromise();
      this.teamList = res.teamList;
      this.teamsCnt = res.teamsCnt;

      // 検索ボタン押下済みフラグをONにする
      this.searchFlg = true;
    } catch(e) {
      await this.commonService.errorOnService(CNS.targetTypeTeam, CNS.actionTypeSearch);
    }
  }

  public teamDetail(team: TeamForTmOrgList): void {
    this.commonService.navigateWithEdit(CNS.pathToTeamDetail, {
      id: team.teamID,
      type: CNS.infoTypeTeam
    });
  }

  /**
   * Enterキー・スペースキー押下時にクリックイベント発火
   */
  public onKeyCheck(value: KeyboardEvent): void {
    this.commonService.onKeyCheck(value);
  }
}
