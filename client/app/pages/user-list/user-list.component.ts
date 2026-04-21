import { Component, OnInit } from '@angular/core';
import { UntypedFormGroup, Validators, UntypedFormBuilder } from '@angular/forms';
import {ActivatedRoute } from '@angular/router';
import { CommonService } from '../../common/common.service';
import { User } from 'defs/entity';
import type { ObjectId } from 'mongodb';
import { CNS } from 'client/app/common/defines';
import { MSG } from '../../common/message-defines';

@Component({
  selector: 'app-user-list',
  templateUrl: './user-list.component.html',
  styleUrls: ['./user-list.component.scss']
})
export class UserListComponent implements OnInit {

  // 変数
  formGroup: UntypedFormGroup;

  user: User;

  invitedUserList: ObjectId[];

  searchType: string;

  msg = MSG;

  /**
   * コンストラクタ
   * @param commonService
   * @param formBuilder
   * @param activate
   */
  constructor(private commonService: CommonService,
    private formBuilder: UntypedFormBuilder,
    private activate: ActivatedRoute) {
      // 初期値設定
      this.invitedUserList = [];

      // 入力フォーム初期値設定
      this.formGroup = formBuilder.group({
        userUniqueID: ['', [Validators.required, Validators.pattern(/^(?=.*?[a-zA-Z])(?=.*?\d)[a-zA-Z\d]{8,20}$/)]]
      });

      // 検索種別取得
      activate.paramMap.subscribe(params => {
        this.searchType = params.get('searchType');
      });
  }

  /**
   * 初期処理
   */
  public async ngOnInit(): Promise<void> {
    // 検索対象のID情報を取得
    const editInfo = this.commonService.getEditInfo();

    // 検索種別ごとに処理を変更する
    if(this.searchType === CNS.typeofUserListTeam) {
      try {
        // チームスタッフの場合、
        const res = await this.commonService.apiPost('team/getInvitedStaff', {
          teamId: editInfo.id
        }).toPromise();
        this.invitedUserList = res.invitedUser;

      } catch(e) {
        await this.commonService.errorOnService(CNS.targetTypeConnection + CNS.targetTypeInformation, CNS.actionTypePrepare);
        this.commonService.navigateBack();
      }
    }
    else if(this.searchType === CNS.typeofUserListOrgan) {
      try {
        // 団体スタッフの場合
        const res = await this.commonService.apiPost('organ/getInvitedStaff', {
          organId: editInfo.id
        }).toPromise();
        this.invitedUserList = res.invitedUser;

      } catch(e) {
        await this.commonService.errorOnService(CNS.targetTypeConnection + CNS.targetTypeInformation, CNS.actionTypePrepare);
        this.commonService.navigateBack();
      }
    }
  }

  /**
   * 検索ボタン押下時処理
   */
  public async onSearch(): Promise<void> {
    const data = this.formGroup.value;

    try {
      const res = await this.commonService.apiPost('user/userList', data).toPromise();
      this.user = res.user;
    } catch(e) {
      await this.commonService.errorOnService(CNS.targetTypeTarget, CNS.actionTypeSearch);
    }
  }

  /**
   * ユーザー招待処理
   * @param user
   */
  public async inviteStaff(user: User): Promise<void> {

    // 確認ダイアログ表示
    const dialog = await this.commonService.openConfirmDialog(this.msg.confirmationTitle, this.msg.inviteConfirmation.replace('※1',user.nickname));

    // キャンセルなら処理中断
    if(!dialog) {
      return;
    }

    // 対象種別により処理を変更
    if(this.searchType === CNS.typeofUserListTeam) {
      try {
        // teamの場合、team/inviteStaffを呼び出しする
        const res = await this.commonService.apiPost('team/inviteStaff', {
          userId: user._id,
          teamId: this.commonService.getEditInfo().id
        }).toPromise();

        // サーバサイド処理結果判定
        if(res.result == 'ok') {
          await this.commonService.openNoticeDialog(this.msg.inviteTitle, this.msg.inviteDone.replace('※1',user.nickname));
          // 招待済みユーザーデータの更新
          this.invitedUserList = res.invitedUser;
        } else {
          await this.commonService.errorOnApp();
        }
      } catch(e) {
        await this.commonService.errorOnService(user.nickname, CNS.actionTypeInvite);
      }
    }

    else if(this.searchType === CNS.typeofUserListOrgan) {
      try {
        // 団体の場合、organ/inviteStaffを呼び出しする
        const res = await this.commonService.apiPost('organ/inviteStaff', {
          userId: user._id,
          organId: this.commonService.getEditInfo().id
        }).toPromise();

        // サーバサイド処理結果判定
        if(res.result == 'ok') {
          await this.commonService.openNoticeDialog(this.msg.inviteTitle, this.msg.inviteDone.replace('※1',user.nickname));
          // 招待済みユーザーデータの更新
          this.invitedUserList = res.invitedUser;
        } else {
          await this.commonService.errorOnApp();
        }
      } catch(e) {
        await this.commonService.errorOnService(user.nickname, CNS.actionTypeInvite);
      }
    }
  }

  /**
   * ユーザーの招待済み判定処理
   * @return true: 招待済み / false: 招待
   */
  public isInvited(user: User): boolean {
    return (this.invitedUserList.indexOf(user._id) > -1);
  }

  /**
   * 所属スタッフ判定
   * @return true: 所属 / false: 未所属
   */
  belongToOrgan(user: User): boolean {
    const chkStaff = this.commonService.getEditInfo().staffList.find(staff => {
      return staff._id == user._id;
    });
    return chkStaff? true : false;
  }

  /**
   * 戻るボタン押下時処理
   */
  public onClickBack(): void{
    this.commonService.navigateBack();
  }

}
