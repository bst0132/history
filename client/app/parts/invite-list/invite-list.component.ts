import { Component, OnInit } from '@angular/core';
import { CommonService } from '../../common/common.service';
import { InviteInfo } from 'defs/api';
import { MSG } from '../../common/message-defines';
import { CNS } from 'client/app/common/defines';

@Component({
  selector: 'app-invite-list',
  templateUrl: './invite-list.component.html',
  styleUrls: ['./invite-list.component.scss']
})
export class InviteListComponent implements OnInit {

  public inviteList: InviteInfo[];

  msg = MSG;

  // デバイス判定用変数
  device: 'pc' | 'sp';

  constructor(private commonService: CommonService) {

    // デバイス判定
    this.device = commonService.isMobile ? 'sp' : 'pc';
  }

  public async ngOnInit(): Promise<void> {
    try {
      const res = await this.commonService.apiPost('user/inviteList', {
        userId: this.commonService.getLoginInfo().userId
      }).toPromise();
      this.inviteList = res.inviteList;

      // デバイスがTBまたはPCで招待がある場合、通知ダイアログ表示
      if(this.device == 'pc' && this.inviteList.length > 0) {
        await this.commonService.openNoticeDialog(this.msg.notice, this.msg.noticeMsg);
      }

    } catch(e) {
      await this.commonService.errorOnService(CNS.targetTypeNotify, CNS.actionTypePrepare);
      this.commonService.navigateBack();
    }
  }

  public async onClickAccept(invite: InviteInfo): Promise<void> {
    const dialog = await this.commonService.openConfirmDialog(this.msg.confirmationTitle, this.msg.participationConfirmation.replace('※1',invite.inviteOriName));

    // キャンセルなら処理中断
    if(!dialog) {
      return;
    }

    try {
      const res = await this.commonService.apiPost('user/responseInvite', {
        inviteId: invite.inviteId,
        action: 'accept'
      }).toPromise();

      if (res.result == 'ok') {
        if(invite.inviteType === 'teamStaff' || invite.inviteType === 'organStaff' || invite.inviteType === 'memberCompetition') {
          const loginInf = this.commonService.getLoginInfo();
          // チームスタッフの招待を承諾した場合、権限を更新する
          if(invite.inviteType === 'teamStaff' && !loginInf.isAdminTeam) {
            loginInf.isAdminTeam = true;
            // セッション情報の更新
            this.commonService.setLoginInfo(loginInf);
          }
          // 団体のスタッフの招待を承諾した場合、権限を更新する
          if(invite.inviteType === 'organStaff' && !loginInf.isAdminOrgan) {
            loginInf.isAdminOrgan = true;
            // セッション情報の更新
            this.commonService.setLoginInfo(loginInf);
          }
          // 大会管理者の招待を承諾した場合、権限を更新する
          if(invite.inviteType === 'memberCompetition' && !loginInf.isAdminComp) {
            this.commonService.getLoginInfo().isAdminComp = true;
          }
        }
        // ダイアログ表示
        await this.commonService.openNoticeDialog(this.msg.participationDoneTitle, this.msg.participationDone.replace('※1',invite.inviteOriName));
        this.inviteList = res.inviteList;
      } else {
        await this.commonService.errorOnApp();
      }

    } catch(e) {
      await this.commonService.errorOnService(invite.inviteOriName, CNS.actionTypeJoin);
    }
  }

  public async onClickDecline(invite: InviteInfo): Promise<void> {
    const dialog = await this.commonService.openConfirmDialog(this.msg.confirmationTitle, this.msg.inviteRejectConfirmation.replace('※1',invite.inviteOriName));

    // キャンセルなら処理中断
    if(!dialog) {
      return;
    }

    try {
      const res = await this.commonService.apiPost('user/responseInvite', {
        inviteId: invite.inviteId,
        action: 'decline'
      }).toPromise();

      if (res.result == 'ok') {
        await this.commonService.openNoticeDialog(this.msg.inviteRejectDoneTitle, this.msg.inviteRejectDone.replace('※1',invite.inviteOriName));
        this.inviteList = res.inviteList;
      } else {
        await this.commonService.errorOnApp();
      }

    } catch(e) {
      await this.commonService.errorOnService(invite.inviteOriName + CNS.actionTypeInvite, CNS.actionTypeRefuse);
    }
  }


}
