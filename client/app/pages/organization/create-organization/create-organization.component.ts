import { Component, ElementRef, ViewChild } from '@angular/core';
import { UntypedFormGroup, UntypedFormBuilder, Validators } from '@angular/forms';
import { CommonService } from 'client/app/common/common.service';
import { CNS, prefectures, sports } from 'client/app/common/defines';
import Organ from 'defs/entity/organ';
import ImageInf from 'defs/entity/imageInf';
import { MSG } from '../../../common/message-defines';

@Component({
  selector: 'app-create-organization',
  templateUrl: './create-organization.component.html',
  styleUrls: ['./create-organization.component.scss']
})
export class CreateOrganizationComponent {

  msg = MSG;

  @ViewChild('organLogo')
  organLogo: ElementRef;

  /**
   * コンストラクタ
   *
   * @param commonService 共通処理
   * @param formBuilder   入力フォームグループ設定用クラス
   */
  constructor(private commonService: CommonService, private formBuilder: UntypedFormBuilder) {

    // 入力項目を予め設定
    this.formGroup  = this.formBuilder.group({
      organName: ['', [Validators.required, Validators.maxLength(50)]], // 団体名 [必須]
      sports: ['', Validators.required],            // 競技   [必須]
      organAddInf: this.formBuilder.group({
        organCountry: ['日本', Validators.required],// 団体所在地(国) [必須]
        organPrefecture: ['', Validators.required], // 団体所在地(都道府県) [必須]
        organCity: ['', [Validators.required, Validators.maxLength(100)]] // 団体所在地(市区町村) [必須]
      }),
      organIntro: ['', Validators.maxLength(1000)] // 団体紹介
    });

  }
  // 変数宣言
  public formGroup: UntypedFormGroup;
  public dataUrl: string;
  public sportslist: {key: string;value: string}[] = sports;
  public imageInfo: ImageInf = {
    dataUrl: '',
    transform: ''
  };
  public prefectures = prefectures; // 47都道府県格納用

  canDeactive(): boolean {
    return !this.formGroup.dirty;
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
   * 登録処理
   *
   */
  public async onClickSubmit(): Promise<void> {
    // 入力フォームのオブジェクトをDB用オブジェクトクラスに変換
    const data = this.formGroup.value as Organ;

    // 画像URLを設定
    if(this.imageInfo) {
      data.organLogo = this.imageInfo;
    }

    // 団体管理者情報の設定
    // ToDO: サーバーに処理を持って行く。
    data.organAdminInf = [{
      adminUserID: this.commonService.getLoginInfo().userId,
      adminFlg: '1',
      adminIsValid: true,
      lastUpdDate: new Date().toISOString()
    }];

    const dialog = await this.commonService.openConfirmDialog(this.msg.confirmationTitle, this.msg.regConfirmation.replace('※1', CNS.targetTypeOrg));

    // キャンセルなら処理中断
    if(!dialog) {
      return;
    }

    // データ登録API呼び出し
    try {
      const res = await this.commonService.apiPost('organ/createOrgan', data).toPromise();

      // 結果出力
      if(res.result == 'ok') {
        // 権限の更新
        if(!this.commonService.isAdminOrgan) {
          this.commonService.getLoginInfo().isAdminOrgan = true;
        }

        // ダイアログ表示
        await this.commonService.openNoticeDialog(this.msg.regTitle, this.msg.regDone.replace('※1', CNS.targetTypeOrg));

        // フォームの変更状態をもとに戻す
        this.formGroup.markAsPristine();

        // 団体編集画面へ遷移
        this.commonService.navigateFromCreate(CNS.pathToManageOrgan, {
          id: res.id,
          type: CNS.infoTypeOrgan
        });

      } else if(res?.message) {
        await this.commonService.openNoticeDialog(this.msg.errTitle, this.msg.regErr.replace('※1', CNS.targetTypeOrg) + '\n' + res.message);
      } else {
        await this.commonService.errorOnApp();
      }
    } catch(e) {
      await this.commonService.errorOnService(CNS.targetTypeOrg, CNS.actionTypeReg);
    }
  }

}
