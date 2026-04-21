import { Component } from '@angular/core';
import { UntypedFormGroup, UntypedFormBuilder, Validators } from '@angular/forms';
import { CommonService } from '../../../common/common.service';
import { ObjectId } from 'mongodb';
import { InviteOrganInfo, InviteOrganizerTeamInfo} from 'defs/api';
import { CNS } from '../../../common/defines';
import { MSG } from '../../../common/message-defines';

@Component({
  selector: 'app-invite-organ',
  templateUrl: './invite-organ.component.html',
  styleUrls: ['./invite-organ.component.scss']
})
export class InviteOrganComponent {

  formGroup: UntypedFormGroup;

  // 検索した団体情報の配列
  organList: InviteOrganInfo[];

  // 検索したチーム情報の配列
  teamList: InviteOrganizerTeamInfo[];

  invitedOrganList: ObjectId[];

  msg = MSG;

  /**
   * コンストラクタ
   * @param commonService
   * @param formBuilder
   * @param activatedRoute
   */
  constructor(private commonService: CommonService, private formBuilder: UntypedFormBuilder) {

    this.formGroup = this.formBuilder.group({
      sports: ['', Validators.required],
      organName: ['', Validators.required]
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
      const res = await this.commonService.apiPost('competition/searchOrgan', {
        data: data,
        compId: this.commonService.getEditInfo().id
      }).toPromise();

      // 取得情報の設定
      // 検索した団体情報を設定
      this.organList = res.organInfoList;
      // 検索したチーム情報を設定
      this.teamList = res.teamInfoList;
      this.invitedOrganList = res.invitedList;

    } catch(e) {
      this.commonService.errorOnApi(e);
    }

  }

  /**
   * 主催団体へ選択した団体又はチームを招待
   * @param organ
   */
  public async inviteOrgan(organ: InviteOrganInfo | InviteOrganizerTeamInfo): Promise<void> {

    // チーム名又は団体名を代入する変数
    let organName: string;
    // typeがチームである場合organNameにチーム名を代入する
    if(organ.type == CNS.authTypeOrganizerTeam && 'teamName' in organ){
      organName = organ.teamName;
    // typeが団体である場合organNameに団体名を代入する
    } else if (organ.type == CNS.authTypeOrganizerOrgan && 'organName' in organ) {
      organName = organ.organName;
    }

    // 確認ダイアログ表示
    const dialog = await this.commonService.openConfirmDialog(this.msg.confirmationTitle, this.msg.inviteConfirmation.replace('※1',organName));

    // キャンセルなら処理中断
    if(!dialog) {
      return;
    }

    try {
      // 参加招待を送る
      const res = await this.commonService.apiPost('competition/invite', {
        authDstUserID: organ.id,
        compId: this.commonService.getEditInfo().id,
        type: organ.type
      }).toPromise();

      // サーバサイド処理結果判定
      if(res.result == 'ok') {
        await this.commonService.openNoticeDialog(this.msg.inviteTitle, this.msg.inviteDone.replace('※1',organName));
        // 招待したIDを招待済みのIDリストに加える
        this.invitedOrganList.push(res.invitedId);

      } else {
        await this.commonService.openNoticeDialog(this.msg.errTitle, this.msg.inviteErr.replace('※1',organName));
      }

    } catch(e) {
      this.commonService.errorOnApi(e);
    }

  }

  /**
   * 招待済みであるか判定を行う
   * @param organ
   */
  public isInvited(organ: InviteOrganInfo): boolean {
    return (this.invitedOrganList.indexOf(organ.id) > -1);
  }

  /**
   * 大会情報管理に戻る
   */
  public returnManageCompetition(): void {
    this.commonService.navigateBack();
  }

}
