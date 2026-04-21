import { Component, OnInit } from '@angular/core';
import { CommonService } from 'client/app/common/common.service';
import { TeamHistoryInfo } from 'defs/api';
import { CNS } from '../../../common/defines';
import { UntypedFormGroup, Validators, ValidatorFn, UntypedFormBuilder } from '@angular/forms';
import { formatDate } from '@angular/common';
import { MSG } from '../../../common/message-defines';

@Component({
  selector: 'app-team-history-list',
  templateUrl: './team-history-list.component.html',
  styleUrls: ['./team-history-list.component.scss']
})
export class TeamHistoryListComponent implements OnInit {

  teamHisList: TeamHistoryInfo[];

  // 所属期間クリック時のデータ保持用
  targetData = null;

  // モーダルウインドウを初期非表示にする
  showForm = false;

  // 所属開始日操作フラグ
  joinDayControlFlg = false;

  formGroup: UntypedFormGroup;

  msg = MSG;

  // 変更後の所属開始日チェック用バリデーター
  joinDayValidator = (group: UntypedFormGroup): ValidatorFn => {

    let result = null;

    // 変更前の情報がある時のみ実施（初期化処理以降）
    if (this.targetData) {
      // 変更前の所属開始日を取得
      const oldStartDay = this.targetData.teamStartDate;
      const oldStartDayYMD = formatDate(new Date(oldStartDay), 'yyyy/MM/dd', 'en');

      // 変更後の所属開始日を取得
      const newStartDay = group.get('joinDay').value;
      const newStartDayYMD = formatDate(new Date(newStartDay), 'yyyy/MM/dd', 'en');

      // 所属終了日を取得
      const endndDay = this.targetData.teamEndDate;
      let endDayYMD: string;
      if (endndDay) {
        endDayYMD = formatDate(new Date(endndDay), 'yyyy/MM/dd', 'en');
      }

      // 所属開始日の変更前後が同一である場合、エラー
      if (newStartDayYMD == oldStartDayYMD) {
        result = {
          'sameDay': true
        };
      // 変更後の所属開始日が所属終了日より未来の場合、エラー
      } else if (endndDay && newStartDayYMD > endDayYMD) {
        result = {
          'illegalDay': true
        };
      }
    }

    return result;
  };
  /**
   * コンストラクタ
   * @param commonService
   */
  constructor(private commonService: CommonService, private formBuilder: UntypedFormBuilder) {
      // 入力値を保持するオブジェクト
  this.formGroup = this.formBuilder.group({
    joinDay: ['', Validators.required]
  }, {
    validator: this.joinDayValidator
  });
  }

  /**
   * 初期処理
   */
  public async ngOnInit(): Promise<void> {

    // ログイン情報の取得
    const data = this.commonService.getLoginInfo();

    try {
      // チーム履歴取得処理
      const res = await this.commonService.apiPost('user/teamHistoryList', data).toPromise();

      // 取得結果の設定
      this.teamHisList = res.teamHistoryList;
      // チーム履歴のソート処理
      this.sortList();

    } catch(e) {
      await this.commonService.errorOnService(CNS.targetTypeTeam + CNS.targetTypeInformation, CNS.actionTypeGet);
      this.commonService.navigateWithEdit(CNS.pathToProfileDetail);
    }

  }

  /**
   * 所属チームの参照ページへ遷移
   * @param row
   */
  public navigateTeamDetail(row): void {
    // 所属開始日操作フラグ：trueの場合、当処理は未実施とする
    if (this.joinDayControlFlg) {
      this.joinDayControlFlg = false;
      return;
    }
    this.commonService.navigateWithEdit(CNS.pathToTeamDetail, {
      id: row.teamID,
      type: CNS.infoTypeTeam
    });
  }

  /**
   * 所属開始日変更
   */
  public async changeJoinDay(): Promise<void> {

    // 対象レコード情報
    const row = this.targetData;
    // 入力値を保持したオブジェクト
    const data = this.formGroup.value;

    // チームID
    data.teamID = row.teamID;

    try {
      // 更新処理
      const res = await this.commonService.apiPost('user/updateTeamStartDate', data).toPromise();
      if (res.result == 'ok') {
        // 所属開始日の値を変更後の値に修正
        row.teamStartDate = new Date(data.joinDay).toISOString();
        // チーム履歴のソート処理
        this.sortList();
        // 退避用リストにソート後のチーム履歴をコピー
        const evacuationList: TeamHistoryInfo[] = [...this.teamHisList];
        // チーム履歴を破棄
        this.teamHisList = [];
        // チーム履歴に退避用リストをコピーし、ソート表示を完了する
        this.teamHisList = evacuationList;
        // モーダルクローズ処理
        this.closeModal();
        // 修正完了ダイアログ表示
        await this.commonService.openNoticeDialog(this.msg.fixDoneTitle, this.msg.fixDone.replace('※1', CNS.targetTypeTeamStartDate));
      } else {
        await this.commonService.errorOnApp();
      }
    } catch (e) {
      await this.commonService.errorOnService(CNS.targetTypeTeamStartDate, CNS.actionTypeCorrect);
    }
  }

    /**
   * モーダル表示処理
   * 所属開始日がクリックされた場合のイベント
   */
  public openForm(row): void {
    // 対象レコードのデータを保持
    this.targetData = row;
    this.joinDayControlFlg = true;
    this.showForm = true;
  }

  /**
   * モーダルクローズ処理
   * ✖またはグレー部分押下でモーダルを閉じ、フォームに関しては情報クリアにする
   */
  public closeModal(): void {
    this.showForm = false;
    this.formGroup.reset();
  }

  /**
   * 所属開始日修正に関するダイアログ表示
   */
  public async onClickShowInfo(): Promise<void> {
    await this.commonService.openNoticeDialog(this.msg.information, this.msg.pressedProcessing.replace('※1', CNS.targetTypeAffiliationPeriod).replace('※2', CNS.targetTypeTeamStartDate + 'の' + CNS.actionTypeCorrect));
  }

  /**
   * チーム履歴のソート処理
   */
  public sortList(): void {
    this.teamHisList.sort((x, y) => {
      // 競技を昇順でソート
      if (x.sports < y.sports) return -1;
      if (x.sports > y.sports) return 1;
      // 所属期間を降順でソート
      if (x.teamStartDate < y.teamStartDate) return 1;
      if (x.teamStartDate > y.teamStartDate) return -1;
      return 0;
    });
  }

  /**
   * Enterキー・スペースキー押下時にクリックイベント発火
   */
  public onKeyCheck(value: KeyboardEvent): void {
    this.commonService.onKeyCheck(value);
  }
}
