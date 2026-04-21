import { Component, Inject } from '@angular/core';
import { MAT_LEGACY_DIALOG_DATA as MAT_DIALOG_DATA, MatLegacyDialogRef as MatDialogRef } from '@angular/material/legacy-dialog';
import { UntypedFormGroup, UntypedFormBuilder, Validators } from '@angular/forms';
import { MSG } from '../../common/message-defines';
import { ObjectId } from 'mongodb';
import { CNS, prefectures } from '../../common/defines';
import ImageInf from 'defs/entity/imageInf';
import { MatStepper } from '@angular/material/stepper';
import { CommonService } from 'client/app/common/common.service';

export interface DialogGetData {
  compId: string;
  idList: ObjectId[];
}

export interface SearchData {
  teamId: ObjectId;
  teamName: string;
  teamAddInf: string;
  teamLogo?: ImageInf;
  isChecked: boolean;
}

@Component({
  selector: 'app-select-team-dialog',
  templateUrl: './select-team-dialog.component.html',
  styleUrls: ['./select-team-dialog.component.scss']
})
export class SelectTeamDialogComponent {

  // 入力情報保持用
  formGroup: UntypedFormGroup = null;

  // 固定のメッセージ
  msg = MSG;

  // 47都道府県
  prefectures = prefectures;

  // 検索フラグ
  searchFlg = false;

  // チーム数
  teamsCnt: number;

  // テストデータ
  compTeamList: Array<SearchData> = [];

  // 一つ以上選択されているか判定
  haveCheckedBox = false;

  // 重複チーム情報格納用
  regDoneTeam = [];

  // 選択したチーム情報格納用
  selectedTeam = [];

  // 登録処理結果
  regResult: 'ok' | 'ng' | 'exception' = 'ok';

  // デバイス判定用変数
  device: 'pc' | 'sp';

  /**
   * コンストラクタ
   * @param data
   * @param formBuilder
   * @param dialogRef
   */
  constructor(@Inject(MAT_DIALOG_DATA) public data: DialogGetData, private formBuilder: UntypedFormBuilder,
  public commonService: CommonService, private dialogRef: MatDialogRef<SelectTeamDialogComponent>) {
    // マスク部分押下でのクローズを制御
    dialogRef.disableClose = true;

    // コントローラー設定
    this.formGroup = this.formBuilder.group({
      teamName: ['', [Validators.maxLength(50), Validators.required]],
      prefecture: ['', [Validators.required]]
    });

    // デバイス判定
    this.device = commonService.isMobile ? 'sp' : 'pc';
  }

  /**
   * 検索処理
   */
  public async onClickSearch(): Promise<void> {
    // 再検索時のためにリセット
    this.compTeamList = [];

    // 検索条件を取得
    const data = this.formGroup.value;

    try {
      // チーム検索処理
      const res = await this.commonService.apiPost('team/compTeamList', data).toPromise();

      // 正常時の処理
      if (res.result === 'ok') {
        // 検索結果をフロント表示に合わせて整理する
        this.compTeamList = res.compTeamList.map(elm => {
          return({
            ...elm,
            teamAddInf: elm.teamAddInf.teamPrefecture + elm.teamAddInf.teamCity,
            isChecked: false
          });
        });

        // チーム総数格納
        this.teamsCnt = res.teamsCnt;
        // 検索フラグを立てる
        this.searchFlg = true;
        // 選択フラグをfalseにする
        this.haveCheckedBox = false;

      } else {
        // 検索フラグをfalseにする
        this.searchFlg = false;
        // 選択フラグをfalseにする
        this.haveCheckedBox = false;
        // 取得失敗メッセージ
        await this.commonService.errorOnApp();
      }

    } catch {
      // 検索フラグをfalseにする
      this.searchFlg = false;
      // 選択フラグをfalseにする
      this.haveCheckedBox = false;
      // 取得エラーメッセージ
      await this.commonService.errorOnService(CNS.targetTypeTeam, CNS.actionTypeSearch);
    }
  }

  /**
   * チェックボックス選択時処理
   * @param teamInfo
   */
  public onClickBox(teamInfo: SearchData): void {
    // チェックの値を変える
    teamInfo.isChecked = !teamInfo.isChecked;

    // 一つ以上選択されているか判定
    this.haveCheckedBox = this.compTeamList.some((team) => team.isChecked === true);
  }

  /**
   * チーム選択完了処理
   * 選択されたチーム情報をまとめる
   */
  public onClickChkTeam(stepper: MatStepper): void {
    // ページ移動を考慮しリセット
    this.selectedTeam = [];
    this.regDoneTeam = [];

    // 選択されたチーム情報を抽出
    const checkedTeam = this.compTeamList.filter(elm => elm.isChecked === true);
    // 追加可能チーム情報を抽出
    this.selectedTeam = checkedTeam.filter(elm =>
      this.data.idList.every(id => elm.teamId != id)
    );
    // 登録済みのチーム情報を抽出
    this.regDoneTeam = checkedTeam.filter(elm =>
      this.data.idList.some(id => elm.teamId == id)
    );

    // 次のページに移動
    stepper.next();
  }

  /**
   * 登録処理
   * @param stepper
   */
  public async onClickReg(stepper: MatStepper): Promise<void> {
    // 登録処理に渡すデータを整理する
    const regList = this.selectedTeam.map(elm => {
      return({
        teamId: elm.teamId.toString(),
        compId: this.data.compId
      });
    });

    try{
      // 登録処理
      const res = await this.commonService.apiPost('teamGameRecord/addEntryTeam', {regData: {teamInfo: regList}, isRegTeam: true}).toPromise();

      // 正常時の処理
      if (res.result === 'ok') {
        // 処理が正常に行われた場合
        this.formGroup.markAsPristine();
        this.regResult = 'ok';

      } else {
        // 登録に失敗した場合
        this.regResult = 'ng';
        // 選択不可である登録済みチームIDの配列を更新する
        this.data.idList = res.teamIdList.map(elm => elm);
      }

    } catch {
      // 処理にエラーが発生した場合
      this.regResult = 'exception';
    }

    // 次のページに移動
    stepper.next();
  }

  /**
   * 移動先判断
   * 最終ページから「OK」押下後の移動先を指定
   * @param stepper
   */
  public onClickMove(stepper: MatStepper): void {
    if (this.regResult === 'ok') {
      // 登録処理が正常に行われた場合
      this.dialogRef.close(true);
    } else {
      // 選択チームに重複がある場合・エラーが発生した場合
      stepper.selectedIndex = 0;
    }
  }

}
