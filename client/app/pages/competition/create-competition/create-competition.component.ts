import { Component, ViewChild, ElementRef, OnInit } from '@angular/core';
import { CommonService } from '../../../common/common.service';
import { UntypedFormGroup, Validators, UntypedFormBuilder } from '@angular/forms';
import { Competition } from 'defs/entity';
import { CNS } from '../../../common/defines';
import { ObjectId } from 'mongodb';
import ImageInf from 'defs/entity/imageInf';
import { MSG } from '../../../common/message-defines';

@Component({
  selector: 'app-create-competition',
  templateUrl: './create-competition.component.html',
  styleUrls: ['./create-competition.component.scss']
})
export class CreateCompetitionComponent implements OnInit {
  formGroup: UntypedFormGroup;

  organList = [];

  imageInfo: ImageInf = {
    dataUrl: '',
    transform: ''
  };

  msg = MSG;

  /**
   * コンストラクタ
   * @param commonService
   * @param formBuilder
   */
  constructor(private commonService: CommonService, private formBuilder: UntypedFormBuilder) {
    this.formGroup = this.formBuilder.group({
      compName: ['', Validators.required],
      sports: ['', Validators.required],
      heldDate: ['', Validators.required],
      organ: ['', Validators.required],
      compIntro: [''],
      compLogo: ['']
    });
  }

  canDeactive(): boolean {
    return !this.formGroup.dirty;
  }

  /**
   * 初期処理
   */
  public async ngOnInit(): Promise<void> {

    try {
      // 大会登録画面の初期処理
      const res = await this.commonService.apiPost('competition/createCompetitonInit', {}).toPromise();
      // 異常なら再度一覧から検索させる
      if (res.result != 'ok') {
        this.commonService.navigateBack();
        return;
      }

      // 主催団体名のセレクトボックス作成
      res.organList.forEach(organ => {
        this.organList.push({
          organizerFlg: '1',
          organizerID: organ.organID,
          organName: organ.organName,
          sports: organ.sports,
          organAdminInf: organ.organAdminInf
        });
      });

      res.teamList.forEach(team => {
        this.organList.push({
          organizerFlg: '2',
          organizerID: team.teamID,
          organName: team.teamName,
          sports: team.sports,
          organAdminInf: team.teamAdminInf
        });
      });

    } catch(e) {
      this.commonService.errorOnApi(e);
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
   * 大会情報登録処理
   */
  public async onSubmit(): Promise<void> {
    // サーバサイドに送るデータをフォームから設定
    const data = this.formGroup.value as Competition;
    if(this.imageInfo) {
      data.compLogo = this.imageInfo;
    }

    // ダイアログ表示
    const dialog = await this.commonService.openConfirmDialog(this.msg.confirmationTitle, this.msg.regConfirmation.replace('※1','大会'));

    // キャンセルなら処理中断
    if(!dialog) {
      return;
    }

    try {
      // 大会情報登録処理
      const res = await this.commonService.apiPost('competition/createCompetition', data).toPromise();

      // サーバサイド処理結果判定
      if(res.result == 'ok') {
        // 大会管理者の権限を更新する
        if(!this.commonService.isAdminComp) {
          this.commonService.getLoginInfo().isAdminComp = true;
        }

        await this.commonService.openNoticeDialog(this.msg.regTitle, this.msg.regDone.replace('※1','大会'));

        // フォームの変更状態をもとに戻す
        this.formGroup.markAsPristine();

        // 大会編集画面に遷移する
        this.navigateManageCompetition(res.compID);

      } else {
        await this.commonService.openNoticeDialog(this.msg.errTitle, this.msg.regErr.replace('※1','大会'));
      }

    } catch(e) {
      this.commonService.errorOnApi(e);
    }

  }

  /**
   * 大会情報画面への遷移処理
   */
  public navigateManageCompetition(compID: ObjectId): void {
    this.commonService.navigateFromCreate(CNS.pathToManageCompetition, {
      id: compID,
      type: 'competition'
    });
  }

  /**
   * 選択した主催団体に対応するスポーツの値を設定する
   */
  public getSports(): void {
    const organ = this.formGroup.get('organ').value;
    if(!organ) {
      this.formGroup.get('sports').setValue('');
    } else {
      this.formGroup.get('sports').setValue(organ.sports);
    }
  }

}
