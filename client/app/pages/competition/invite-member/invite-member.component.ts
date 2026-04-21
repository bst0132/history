import { Component, OnInit} from '@angular/core';
import { UntypedFormGroup, UntypedFormBuilder, Validators, UntypedFormArray } from '@angular/forms';
import { CommonService } from '../../../common/common.service';
import { ObjectId } from 'mongodb';
import { OrganizerInfo } from 'defs/api';
import { CNS } from '../../../common/defines';
import { MSG } from '../../../common/message-defines';


@Component({
  selector: 'app-invite-member',
  templateUrl: './invite-member.component.html',
  styleUrls: ['./invite-member.component.scss']
})
export class InviteMemberComponent implements OnInit {

  formGroup: UntypedFormGroup;

  form: UntypedFormGroup;

  // 主催者団体のリスト
  organizerList: OrganizerInfo[];

  // 招待済みのリスト
  invitedMemberList: ObjectId[];

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
      userId: [''],
      organInfo: [''],
      name: [''],
    });
    this.form = this.formBuilder.group({
      member: this.formBuilder.array([])
    });
  }

  /**
   * 初期処理
   */
  public async ngOnInit(): Promise<void> {

    // 競技を遷移元から取得し設定
    const editInfo = this.commonService.getEditInfo();
    this.formGroup.get('sports').setValue(editInfo.sports);

    try {
      // 主催者団体のセレクトボックス内容を取得する
      const res = await this.commonService.apiPost('competition/getOrganizer', {
        compId: this.commonService.getEditInfo().id
      }).toPromise();

      // 取得結果の設定
      this.organizerList = res.organizerList;

    } catch(e) {
      this.commonService.errorOnApi(e);
      this.commonService.navigateBack();
    }

  }

  /**
   * 検索処理
   */
  public async onSearch(): Promise<void> {

    // フォーム初期化
    this.form = this.formBuilder.group({
      member: this.formBuilder.array([])
    });

    // 画面情報の設定
    const data = this.formGroup.value;

    // 検索処理
    try {
      const res = await this.commonService.apiPost('competition/searchMember', {
        data: data,
        compId: this.commonService.getEditInfo().id
      }).toPromise();

      // 取得情報の設定
      // 招待済みのメンバーを設定
      this.invitedMemberList = res.invitedList;

      // 検索結果
      const compOrgNames = this.organizerList.map(org => org.organName);
      const formArray = this.form.get('member') as UntypedFormArray;
      res.inviteMemberInfoList.forEach(member => {
        const orgNameList = [];
        for (let i = 0; i < member.organizerNames.length; i++) {
          if(compOrgNames.includes(member.organizerNames[i])) {
            orgNameList.push(`${member.organizerNames[i]}`);
          }
        }
        const orgNames = orgNameList.join('\n');

        formArray.push(this.formBuilder.group({
          _id: [member._id],
          userId: [member.userId],
          organizerNames: [orgNames],
          name: [member.name]
        }));
      });

    } catch(e) {
      this.commonService.errorOnApi(e);
    }

  }

  /**
   * 大会参加メンバーへ招待
   * @param i
   */
  public async inviteMember(i: number): Promise<void> {

    // 画面項目取得
    const member = this.form.get('member').value[i];

    // 確認ダイアログ表示
    const dialog = await this.commonService.openConfirmDialog(this.msg.confirmationTitle, this.msg.inviteConfirmation.replace('※1',member.name));

    // キャンセルなら処理中断
    if(!dialog) {
      return;
    }

    // メンバー招待を送る
    try {
      const res = await this.commonService.apiPost('competition/invite', {
        authDstUserID: member._id,
        compId: this.commonService.getEditInfo().id,
        type: CNS.authTypeMember
      }).toPromise();

      // サーバサイド処理結果判定
      if(res.result == 'ok') {
        await this.commonService.openNoticeDialog(this.msg.inviteTitle, this.msg.inviteDone.replace('※1',member.name));
        // 招待したIDを招待済みのIDリストに加える
        this.invitedMemberList.push(res.invitedId);

      } else {
        await this.commonService.openNoticeDialog(this.msg.errTitle, this.msg.inviteErr.replace('※1',member.name));
      }

    } catch(e) {
      this.commonService.errorOnApi(e);
    }

  }

  /**
   * 招待済みであるか判定を行う
   * @param i
   */
  public isInvited(i: number): boolean {
    const obj = this.form.get('member').value[i];
    return (this.invitedMemberList.indexOf(obj._id) > -1);
  }

  /**
   * menberのgetter
   */
  get getMember(): UntypedFormArray {
    return this.form.get('member') as UntypedFormArray;
  }

  /**
   * 大会情報管理に戻る
   */
  public returnManageCompetition(): void {
    this.commonService.navigateBack();
  }

}
