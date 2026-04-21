import { Component } from '@angular/core';
import { UntypedFormGroup, UntypedFormBuilder, Validators } from '@angular/forms';
import { CommonService } from '../../../common/common.service';
import { prefectures } from '../../../common/defines';
import { ObjectId } from 'mongodb';
import { InviteTeamInfo } from 'defs/api';
import { CNS } from '../../../common/defines';
import { MSG } from '../../../common/message-defines';

@Component({
  selector: 'app-invite-team',
  templateUrl: './invite-team.component.html',
  styleUrls: ['./invite-team.component.scss']
})
export class InviteTeamComponent {

  formGroup: UntypedFormGroup;

  teamInfoList: InviteTeamInfo[]

  invitedTeamList: ObjectId[];

  prefectures = prefectures; // 47都道府県格納用

  msg = MSG;

  constructor(private commonService: CommonService, private formBuilder: UntypedFormBuilder) {
    this.formGroup = this.formBuilder.group({
      sports: ['', Validators.required],
      teamName: [''],
      searchType: [''],
      teamPrefecture: ['', Validators.required]
    });

    // 競技を遷移元から取得し設定
    const editInfo = this.commonService.getEditInfo();
    this.formGroup.get('sports').setValue(editInfo.sports);
  }

  /**
   * 検索処理
   */
  public async onSearch(): Promise<void> {
    // 画面情報の設定
    const data = this.formGroup.value;

    try {
      // 検索処理
      const res = await this.commonService.apiPost('competition/searchTeam', {
        data: data,
        compId: this.commonService.getEditInfo().id
      }).toPromise();

      // 取得情報の設定
      this.teamInfoList = res.teamInfoList;
      this.invitedTeamList = res.invitedList;

    } catch(e) {
      this.commonService.errorOnApi(e);
    }

  }

  /**
   * 大会参加チームへ招待
   * @param team
   */
  public async inviteTeam(team: InviteTeamInfo): Promise<void> {

    // 確認ダイアログ表示
    const dialog = await this.commonService.openConfirmDialog(this.msg.confirmationTitle, this.msg.inviteConfirmation.replace('※1',team.teamName));

    // キャンセルなら処理中断
    if(!dialog) {
      return;
    }

    try {
      // 参加チーム招待を送る
      const res = await this.commonService.apiPost('competition/invite', {
        authDstUserID: team._id,
        compId: this.commonService.getEditInfo().id,
        type: CNS.authTypeTeam
      }).toPromise();

      // サーバサイド処理結果判定
      if(res.result == 'ok') {
        await this.commonService.openNoticeDialog(this.msg.inviteTitle, this.msg.inviteDone.replace('※1',team.teamName));
        // 招待したIDを招待済みのIDリストに加える
        this.invitedTeamList.push(res.invitedId);

      } else {
        await this.commonService.openNoticeDialog(this.msg.errTitle, this.msg.inviteErr.replace('※1',team.teamName));
      }

    } catch(e) {
      this.commonService.errorOnApi(e);
    }

  }

  /**
   * 招待済みであるか判定を行う
   * @param taam
   */
  public isInvited(team: InviteTeamInfo): boolean {
    return (this.invitedTeamList.indexOf(team._id) > -1);
  }

  /**
   * 戻るボタンの処理
   * 大会情報管理に戻る
   */
  public returnManageCompetition(): void {
    this.commonService.navigateBack();
  }

}
