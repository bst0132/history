import { Component, Inject } from '@angular/core';
import { UntypedFormGroup, UntypedFormBuilder, Validators } from '@angular/forms';
import { MAT_LEGACY_DIALOG_DATA as MAT_DIALOG_DATA, MatLegacyDialogRef as MatDialogRef } from '@angular/material/legacy-dialog';
import { CommonService } from 'client/app/common/common.service';
import { MSG } from 'client/app/common/message-defines';
import { CNS, gameProgressStatuses } from 'client/app/common/defines';

export interface DialogData {
  gameId: number;
  gameDate: string;
  gamePlace: string;
  gameStartTime: number;
  gameProgressStatus: '1' | '2' | '3';
  criteriaScore: number;
  opponentScore: number;
  criteriaWinFlg: boolean;
  freeText: string;
  gameStartedFlg: boolean;
}
@Component({
  selector: 'app-input-match-dialog',
  templateUrl: './input-match-dialog.component.html',
  styleUrls: ['./input-match-dialog.component.scss'],
})
export class InputMatchDialogComponent {

  // 入力情報保持用
  formGroup: UntypedFormGroup = null;

  // メッセージ格納用
  msg=MSG;

  cns = CNS;

  gameProgressStatuses = gameProgressStatuses;

  // 開始時間（時間）格納用
  timeHour = {};

  // 開始時間（分）格納用
  timeMinute = {};

  // 試合開始前フラグ格納用
  beforeGameFlg: boolean = true;

  // 試合開始フラグ格納用
  gameStartedFlg = this.data.gameStartedFlg;

  // 試合開始日時フォーム 項目間チェック用バリデーター
  startTimeVali = (group: UntypedFormGroup): void => {
    const hour = group.get('startTimeHour').value;
    const minute = group.get('startTimeMinute').value;

    // 「時」未入力・「分」入力済みの場合、hourMissingエラー設定
    if(hour === null && minute !== null) {
      group.get('startTimeHour').setErrors({hourMissing: true});

    // 「時」入力済み・「分」未入力の場合、minuteMissingエラー設定
    } else if (hour !== null && minute === null) {
      group.get('startTimeMinute').setErrors({minuteMissing: true});
    }
  };

  constructor(@Inject(MAT_DIALOG_DATA) public data: DialogData, public matDialogRef: MatDialogRef<InputMatchDialogComponent>, public commonService: CommonService, private formBuider: UntypedFormBuilder) {
    // マスク部分押下でのクローズを制御
    matDialogRef.disableClose = true;

    // コントローラ設定
    this.formGroup = this.formBuider.group({
      gamePlace: ['', Validators.maxLength(50)],
      gameDate: [''],
      startTimeHour: [null],
      startTimeMinute: [null],
      gameProgressStatus: [CNS.beforeGame],
      criteriaScore: [null, [Validators.min(0), Validators.max(200), Validators.pattern(/^([1-9]\d*|0)$/)]],
      opponentScore: [null, [Validators.min(0), Validators.max(200), Validators.pattern(/^([1-9]\d*|0)$/)]],
      criteriaWinFlg: [null],
      freeText: ['', Validators.maxLength(50)]
    }, {
      validator: this.startTimeVali
    });
  }

  public async ngOnInit(): Promise<void> {
    // 試合開始時間表示内容を設定
    [...Array(24)].map((_: undefined, index: number) => this.timeHour[(index).toString().padStart(2, '0')] = index);
    [...Array(60)].map((_: undefined, index: number) => this.timeMinute[(index).toString().padStart(2, '0')] = index);

    // フォームに値を設定
    this.formGroup.patchValue({
      gamePlace: this.data.gamePlace,
      gameDate: this.data.gameDate,
      startTimeHour: this.data.gameStartTime !== null ? Math.floor(this.data.gameStartTime / 100) : null,
      startTimeMinute: this.data.gameStartTime !== null ? this.data.gameStartTime % 100 : null,
      gameProgressStatus: this.data.gameProgressStatus,
      criteriaScore: this.data.criteriaScore,
      opponentScore: this.data.opponentScore,
      criteriaWinFlg: this.data.criteriaWinFlg,
      freeText: this.data.freeText
    });

    // 試合開始前フラグ設定
    this.beforeGameFlg = this.setBeforeGameFlg();
  }

  public editGameData(): void {

    const data = this.formGroup.value;

    // 基準・対戦チームの得点がどちらか一方でも入力されていない、または試合経過が「試合終了」以外の場合、基準チーム勝利判定フラグ初期化
    if (data.criteriaScore === null || data.opponentScore === null || data.gameProgressStatus !== CNS.afterGame) {
      data.criteriaWinFlg = null;

      // 試合詳細初期化（試合経過が「試合終了」ではないため）
      data.freeText = '';

    // 基準・対戦チームの得点が違う点数、かつ試合経過が「試合終了」の場合、基準チーム勝利判定フラグ設定
    } else if (!(data.criteriaScore === data.opponentScore) && data.gameProgressStatus === CNS.afterGame) {
      data.criteriaWinFlg = data.criteriaScore > data.opponentScore ? true : false;

      // 試合詳細初期化（同点ではないため）
      data.freeText = '';
    }

    // レスポンス用データ(時と分まとまっている)
    const responseData = {
      gameId: this.data.gameId,
      gameDate: data.gameDate,
      gamePlace: data.gamePlace,
      gameStartTime: isNaN(data.startTimeHour * 100 + data.startTimeMinute) ? null : data.startTimeHour * 100 + data.startTimeMinute,
      gameProgressStatus: data.gameProgressStatus,
      criteriaScore: data.criteriaScore,
      opponentScore: data.opponentScore,
      criteriaWinFlg: data.criteriaWinFlg,
      freeText: data.freeText
    };
    this.matDialogRef.close(responseData);
  }

  /**
   * 得点入力欄の制限・勝利チームフラグ設定
   */
  public onScoreCheck(score: KeyboardEvent): void {
    this.commonService.onNumberCheck(score);
  }

  public onChangeProgress(): void {
    // 試合開始前フラグ設定
    this.beforeGameFlg = this.setBeforeGameFlg();
  }

  /**
   * 試合開始前フラグ設定
   * @returns
   */
  public setBeforeGameFlg(): boolean {
    return this.formGroup.get('gameProgressStatus').value === CNS.beforeGame;
  }

  /**
   * 時刻フォームのtouchedフラグ設定
   */
  public setTimeTouchedFlg(): void {

    // hourMissingエラーが発生している場合、startTimeHourにtouchedフラグをたてる
    if (this.formGroup.get('startTimeHour').hasError('hourMissing')) {
      this.formGroup.get('startTimeHour').markAsTouched();

    // minuteMissingエラーが発生している場合、startTimeMinuteにtouchedフラグをたてる
    } else if (this.formGroup.get('startTimeMinute').hasError('minuteMissing')) {
      this.formGroup.get('startTimeMinute').markAsTouched();
    }
  }

  /**
   * Enterキー・スペースキー押下時にクリックイベント発火
   */
  public onKeyCheck(value: KeyboardEvent): void {
    this.commonService.onKeyCheck(value);
  }
}
