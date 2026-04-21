import { Component, OnInit } from '@angular/core';
import { UntypedFormGroup, UntypedFormBuilder, UntypedFormArray, UntypedFormControl } from '@angular/forms';
import { CommonService } from '../../../common/common.service';
import { ObjectId } from 'mongodb';
import { CompInfForCreGame, TeamInfo } from 'defs/api';
import { MSG } from '../../../common/message-defines';

@Component({
  selector: 'app-create-league',
  templateUrl: './create-league.component.html',
  styleUrls: ['./create-league.component.scss']
})
export class CreateLeagueComponent implements OnInit {

  formGroup: UntypedFormGroup;

  compInfo: CompInfForCreGame;

  teamList: TeamInfo[];

  msg = MSG;

  constructor(private commonService: CommonService, private formBuilder: UntypedFormBuilder) {
    this.formGroup = this.formBuilder.group({
      gameGroupName: [''],
      groupPartTeamCnt: [''],
      teamList: this.formBuilder.array([])
    });
  }

  canDeactive(): boolean {
    return !this.formGroup.dirty;
  }

  async ngOnInit(): Promise<void> {

    const editInfo = this.commonService.getEditInfo();
    if(!editInfo || editInfo.type != 'game') {
      this.commonService.navigateBack();
      return;
    }

    try {
      const res = await this.commonService.apiPost('game/getCompInfo', editInfo).toPromise();
      // 異常なら再度一覧から検索させる
      if (res.result != 'ok') {
        this.commonService.navigateBack();
        return;
      }

      this.compInfo = res.compInfo;
      this.teamList = res.teamList;

      // グループ名称、参加チーム数の設定
      this.formGroup.get('gameGroupName').setValue(editInfo.gameGroupName);
      this.formGroup.get('groupPartTeamCnt').setValue(editInfo.groupPartTeamCnt);

      // 参加チーム数の分だけフォームコントロールを生成
      const formArray = this.formGroup.get('teamList') as UntypedFormArray;
      for (let index = 0; index < editInfo.groupPartTeamCnt; index++) {
        formArray.push(new UntypedFormControl(''));
      }

    } catch(e) {
      this.commonService.errorOnApi(e);
      this.commonService.navigateBack();
    }

  }

  /**
   * 数値を配列に変換するメソッド
   * 引数の数値分の長さを持つ配列を返却する
   * @param number
   */
  public arrayNumberLength(number: string): Array<number>[] {
    const num = parseInt(number);
    return [...Array(num)];
  }

  /**
   * リーグ登録処理
   */
  public async onSubmit(): Promise<void> {

    // サーバサイドに送るデータをフォームから設定
    const data = this.formGroup.value;

    // ダイアログ表示
    const dialog = await this.commonService.openConfirmDialog(this.msg.confirmationTitle, this.msg.regConfirmation.replace('※1','リーグ'));

    // キャンセルなら処理中断
    if(!dialog) {
      return;
    }

    try {
      // リーグ登録処理
      const res = await this.commonService.apiPost('game/createLeague',
        {
          data: data,
          compInfo: this.compInfo
        }).toPromise();

      // サーバサイド処理結果判定
      if(res.result == 'ok') {
        await this.commonService.openNoticeDialog(this.msg.regTitle, this.msg.regDone.replace('※1','リーグ'));
        // フォームの変更状態をもとに戻す
        this.formGroup.markAsPristine();

      } else {
        await this.commonService.openNoticeDialog(this.msg.errTitle, res.message);
      }

    } catch(e) {
      this.commonService.errorOnApi(e);
    }

  }

  /**
   * チームIDからチーム名を検索し返却する処理
   * @param teamID
   */
  public getTeamName(teamID: ObjectId): string {

    // 入力されたチームのIDに紐づくチームオブジェクトを設定
    const findResult = this.teamList.find((team) => {
      return team.teamID === teamID;
    });

    // 検索結果がある場合、チーム名を返却し、無い場合は空文字を返却
    if(findResult) {
      return findResult.teamName;
    } else {
      return '';
    }

  }

  // クリックした行色変える
  public changeRowColor(event): void {
    event.target.parentElement.parentElement.style.backgroundColor  = 'rgba(65, 105, 225, 0.3)';
  }

  // 行の色を元に戻す
  public removeColor(event): void {
    event.target.parentElement.parentElement.style.backgroundColor = '';
  }

  /**
   * TeamListのgetter
   */
  get getTeamList(): UntypedFormArray {
    return this.formGroup.get('teamList') as UntypedFormArray;
  }

  /**
   * 戻るボタン押下時の処理
   */
  public pageBack(): void {
    this.commonService.navigateBack();
  }

  // クリックしたとこ色変わる
  // public changeColor(event): void {
  //   event.target.parentElement.bgColor = 'royalblue';
  // }

}
