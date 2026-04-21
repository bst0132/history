import { Component, ViewChild, ElementRef } from '@angular/core';
import { CommonService } from '../../../common/common.service';
import { UntypedFormGroup, Validators, UntypedFormBuilder } from '@angular/forms';
import { Team } from 'defs/entity';
import ImageInf from 'defs/entity/imageInf';
import { CNS, prefectures, sports } from 'client/app/common/defines';
import { MSG } from '../../../common/message-defines';

@Component({
  selector: 'app-create-team',
  templateUrl: './create-team.component.html',
  styleUrls: ['./create-team.component.scss']
})
export class CreateTeamComponent {

  @ViewChild('teamLogo')
  teamLogo: ElementRef;

  fileReader = new FileReader();

  formGroup: UntypedFormGroup;

  imageInfo: ImageInf = {
    dataUrl: '',
    transform: ''
  };

  prefectures = prefectures; // 47都道府県格納用

  msg = MSG;

  constructor(private commonService: CommonService, private formBuilder: UntypedFormBuilder) {
    this.formGroup  = this.formBuilder.group({
      teamName: ['', [Validators.required, Validators.maxLength(50)]],
      sports: ['', Validators.required],
      teamIntro: ['', Validators.maxLength(1000)],
      teamEstDate: ['', Validators.required],
      teamAddInf: this.formBuilder.group({
        teamCountry: ['日本', Validators.required],
        teamPrefecture: ['', Validators.required],
        teamCity: ['', [Validators.required, Validators.maxLength(100)]]
      }),
      teamTel: ['', Validators.maxLength(20)]
    });
  }
  public sportslist: {key: string;value: string}[] = sports;

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

  async onSubmit(): Promise<void> {
    const data = this.formGroup.value as Team;
    if(this.imageInfo) {
      data.teamLogo = this.imageInfo;
    }
    // TODO apiの通信時にログイン情報含ませるならサーバー側でやったほうがいい
    data.teamAdminInf = [{
      adminUserID: this.commonService.getLoginInfo().userId,
      adminFlg: '1',
      adminIsValid: true,
      lastUpdDate: new Date().toISOString()
    }];

    const dialog = await this.commonService.openConfirmDialog(this.msg.confirmationTitle, this.msg.regConfirmation.replace('※1', CNS.targetTypeTeam));

    // キャンセルなら処理中断
    if(!dialog) {
      return;
    }

    try {
      const res = await this.commonService.apiPost('team/createTeam', data).toPromise();

      if(res.result == 'ok') {
        // 権限の更新
        if(!this.commonService.isAdminTeam) {
          this.commonService.getLoginInfo().isAdminTeam = true;
        }

        // ダイアログ表示
        await this.commonService.openNoticeDialog(this.msg.regTitle, this.msg.regDone.replace('※1', CNS.targetTypeTeam));

        // フォームの変更状態をもとに戻す
        this.formGroup.markAsPristine();

        // チーム編集画面へ遷移
        this.commonService.navigateFromCreate(CNS.pathToEditTeam, {
          id: res.id,
          type: CNS.infoTypeTeam
        });


      } else {
        await this.commonService.openNoticeDialog(this.msg.errTitle, this.msg.regErr.replace('※1', CNS.targetTypeTeam) + '\n' + res?.message);
      }

    } catch(e) {
      await this.commonService.errorOnService(CNS.targetTypeTeam, CNS.actionTypeReg);
    }

  }
}
