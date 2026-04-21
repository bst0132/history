import { Component, OnInit, ViewChild, ElementRef } from '@angular/core';
import { UntypedFormGroup, UntypedFormBuilder, Validators } from '@angular/forms';
import { CommonService } from 'client/app/common/common.service';
import { CNS, prefectures } from 'client/app/common/defines';
import { Organ, User } from 'defs';
import ImageInf from 'defs/entity/imageInf';
import { MSG } from '../../../common/message-defines';

@Component({
  selector: 'app-manage-organ-inf',
  templateUrl: './manage-organ-inf.component.html',
  styleUrls: ['./manage-organ-inf.component.scss']
})
export class ManageOrganInfComponent implements OnInit {


  @ViewChild('organLogo')
  organLogo: ElementRef;

  // 変数
  public formGroup: UntypedFormGroup;
  public sport: string;
  public imageInfo: ImageInf = {
    dataUrl: '',
    transform: ''
  };
  public staffList: Omit<User, '_id' | 'password' | 'mailAdd' | 'parentId'>[];
  public prefectures = prefectures; // 47都道府県格納用

    // 招待中のスタッフを格納する変数
  invitationStaff: string[];

  msg = MSG;

  /**
   * コンストラクタ
   * @param commonService
   * @param formBuilder
   */
  constructor(private commonService: CommonService, private formBuilder: UntypedFormBuilder) {
    // フォームグループを生成
    this.formGroup  = this.formBuilder.group({
      organName: ['', [Validators.required, Validators.maxLength(50)]], // 団体名 [必須]
      sports: ['', Validators.required],            // 競技   [必須]
      organAddInf: this.formBuilder.group({
        organCountry: ['日本', Validators.required],// 団体所在地(国) [必須]
        organPrefecture: ['', Validators.required], // 団体所在地(都道府県) [必須]
        organCity: ['', [Validators.required, Validators.maxLength(100)]] // 団体所在地(市区町村) [必須]
      }),
      organIntro: ['', Validators.maxLength(1000)], // 団体紹介
      _id: ['']                                   // ID
    });
  }

  canDeactive(): boolean {
    return !this.formGroup.dirty;
  }

  public async ngOnInit(): Promise<void> {
    // 照会対象の情報を取得する
    const editInfo = this.commonService.getEditInfo();

    // 照会対象情報が正当でない場合、団体一覧画面に遷移させる: TODO 画面遷移先をCNSに持って行く

    // 情報が設定されていない場合は正当でないこととする
    if(editInfo == void 0){
      this.commonService.navigateBack();
      return;
    }

    // 照会情報が団体情報でない場合は正当でないこととする
    if(editInfo.type !== CNS.infoTypeOrgan){
      this.commonService.navigateBack();
      return;
    }

    try {
      // 正当な場合はデータを取得して設定する
      const res = await this.commonService.apiPost('organ/getOrganFromId', {
        _id: editInfo.id
      }).toPromise();

      // データが正常に取得できた場合はデータを設定
      if(res.result === 'ok'){
        this.formGroup.patchValue(res.organInfo);
        this.imageInfo = res.organInfo.organLogo;
        this.sport = res.organInfo.sports;
        this.staffList = res.staffList;
      } else {
        await this.commonService.errorOnApp();
        this.commonService.navigateBack();
      }

      // 招待中のスタッフの情報を取得する
      this.invitationStaff = res.invitationStaff;

    } catch(e) {
      await this.commonService.errorOnService(CNS.targetTypeOrg + CNS.targetTypeInformation, CNS.actionTypeGet);
      this.commonService.navigateBack();
    }

  }


  /**
   * 画像選択コンポーネントで変更があったらよばれる
   * @param imageInfo 変更後のimageInfo
   */
  onChangeDataUrl(imageInfo: ImageInf): void {
    this.imageInfo = imageInfo;
    // フォームに変更済フラグを立てる
    this.formGroup.markAsDirty();
  }

  /**
   * 変更処理
   *
   */
  public async onClickSubmit(): Promise<void> {
    // 入力フォームのオブジェクトをDB用オブジェクトクラスに変換
    const data = this.formGroup.value as Organ;

    // 画像URLを設定
    if(this.imageInfo){
      data.organLogo = this.imageInfo;
    }
    else{
      data.organLogo = null;
    }

    const dialog = await this.commonService.openConfirmDialog(this.msg.confirmationTitle, this.msg.editConfirmation.replace('※1', CNS.targetTypeOrg + CNS.targetTypeInformation));

    // キャンセルなら処理中断
    if(!dialog) {
      return;
    }

    try {
      // データ登録API呼び出し
      const res = await this.commonService.apiPost('organ/editOrgan', data).toPromise();

      // 結果出力
      if(res.result == 'ok') {
        await this.commonService.openNoticeDialog(this.msg.editDoneTitle, this.msg.editDone.replace('※1', CNS.targetTypeOrg + CNS.targetTypeInformation));

        // フォームの変更状態をもとに戻す
        this.formGroup.markAsPristine();

      } else if(res?.message) {
        await this.commonService.openNoticeDialog(this.msg.errTitle, this.msg.editErr.replace('※1', CNS.targetTypeOrg) + '\n' + res.message);
      } else {
        await this.commonService.errorOnApp();
      }

    } catch(e) {
      await this.commonService.errorOnService(CNS.targetTypeOrg + CNS.targetTypeInformation, CNS.actionTypeEdit);
    }

  }

  /**
   * 詳細へ戻る
   */
  public onClickReturnToDetail(): void{
    this.commonService.navigateBack();
  }

  /**
   * ユーザー招待
   */
  public toInviteStaff(): void {
    // ユーザー一覧を開く
    this.commonService.navigateWithEdit(`${CNS.typeofUserListOrgan}/userList`, {
      id: this.commonService.getEditInfo().id,
      type: this.commonService.getEditInfo().type,
      staffList: this.staffList

    });
  }

  /**
   * 管理者情報削除処理
   * @param id 管理者のID
   * @param name 管理者のニックネーム
   */
  public async removeAdminInfo(id: string, name: string): Promise<void> {

    // ダイアログ表示
    const dialog = await this.commonService.openConfirmDialog(this.msg.confirmationTitle, this.msg.staffReleaseConfirmation.replace('※1',name));

    // キャンセルなら処理中断
    if(!dialog) {
      return;
    }

    try {
      // 管理者情報削除処理
      const res = await this.commonService.apiPost('organ/removeAdminInf', {
        id: id,
        organId: this.commonService.getEditInfo().id,
      }).toPromise();

      // サーバサイド処理結果判定
      // 更新(削除)に成功した場合
      if(res.result == 'ok') {
        // 自分自身を所属スタッフから削除した場合、他に管理している団体が無ければ権限を更新する
        if(!res.isAdminOrgan) {
          const loginInfo = this.commonService.getLoginInfo();
          loginInfo.isAdminOrgan = false;
          // セッション情報の更新
          this.commonService.setLoginInfo(loginInfo);
        }

        await this.commonService.openNoticeDialog(this.msg.staffReleaseDoneTitle, this.msg.staffReleaseDone.replace('※1',name));
        this.ngOnInit();
      // 編集中の団体の管理者が1人の場合
      } else if(res?.message) {
        await this.commonService.openNoticeDialog(this.msg.errTitle, `${res.message}`);
        this.ngOnInit();
      // 更新(削除)に失敗した場合
      } else {
        await this.commonService.errorOnApp();
      }

    } catch(e) {
      await this.commonService.errorOnService(name, CNS.actionTypeCancell);
    }

  }
}
