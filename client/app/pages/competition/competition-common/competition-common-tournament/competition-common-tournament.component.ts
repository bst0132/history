import { Component, Input, Output, EventEmitter } from '@angular/core';
import { MSG } from '../../../../common/message-defines';
import { CNS } from '../../../../common/defines';
import { UntypedFormGroup, UntypedFormArray } from '@angular/forms';
import { CommonService } from 'client/app/common/common.service';

@Component({
  selector: 'app-competition-common-tournament',
  templateUrl: './competition-common-tournament.component.html',
  styleUrls: ['./competition-common-tournament.component.scss']
})
export class CompetitionCommonTournamentComponent {

  constructor(public commonService: CommonService) {
    // デバイス判定
    this.device = this.commonService.getDevice();
  }

  compScaleNumbers = [{ value: 2 }, { value: 4 }, { value: 8 }, { value: 16 }, { value: 32 }, { value: 64 }];
  matchNumbers: string[] = [];
  secondMatchCount = 0;
  thirdMatchCount = 0;
  fourthMatchCount = 0;
  fifthMatchCount = 0;
  sixthMatchCount = 0;

  // message使用用変数
  msg = MSG;

  cns = CNS;

  // デバイス判定用変数
  device: 'pc' | 'sp';

  // 受け取るデータ
  @Input() newGameFlg: boolean;
  @Input() formGroup: UntypedFormGroup;
  @Input() canEdit: boolean;
  @Input() allTeamsSelectedFlg: boolean;

  // 親コンポーネントに対してイベントを発火するためのプロパティ
  @Output() eventOnClickDeleteGame = new EventEmitter<void>();
  @Output() eventTournamentDetail = new EventEmitter<number>();
  @Output() eventOnClickGameStart = new EventEmitter<void>();
  @Output() eventOnClickInputMatchTeam = new EventEmitter<{ i: number; criteriaFlg: boolean }>();
  @Output() eventOnClickInputMatch = new EventEmitter<number>();

  /**
   * トーナメント情報削除処理
   */
  public onClickDeleteGame(): void {
    this.eventOnClickDeleteGame.emit();
  }

  /**
   *  トーナメント情報設定処理
   */
  public tournamentDetail(): void {
    const count = Number(this.formGroup.value.teamCount);

    // 試合情報入力ボタン用index調整
    this.secondMatchCount = count / 2;
    this.thirdMatchCount = count - (count / 4);
    this.fourthMatchCount = count - (count / 8);
    this.fifthMatchCount = count - (count / 16);
    this.sixthMatchCount = count - (count /32);

    // 大会規模変更時に初期化
    if (this.getgameGroupInf.length != 0) {
      this.matchNumbers = [];
    }

    for (let i = 0; i < count / 2; i++) {
      // 配列の中身は使用していない
      this.matchNumbers.push(`number ${i}`);
    }
    this.eventTournamentDetail.emit(this.secondMatchCount);
  }

  /**
   * gameGroupInfのgetter
   */
  get getgameGroupInf(): UntypedFormArray {
    return this.formGroup.get('gameGroupInf') as UntypedFormArray;
  }

  /**
   * gameStartedFlgのgetter
   */
  get getGameStartedFlg(): boolean {
    return this.formGroup.controls.gameStartedFlg.value as boolean;
  }

  /**
   * トーナメント開始処理
   */
  public onClickGameStart(): void {
    this.eventOnClickGameStart.emit();
  }

  /**
   *  チーム名取得処理
   */
  public async onClickInputMatchTeam(i: number, criteriaFlg: boolean): Promise<void> {
    this.eventOnClickInputMatchTeam.emit({i, criteriaFlg});
  }

  /**
   *  試合情報取得処理
   */
  public async onClickInputMatch(i: number): Promise<void> {
    this.eventOnClickInputMatch.emit(i);
  }

  /**
   * Enterキー・スペースキー押下時にクリックイベント発火
   */
  public onKeyCheck(value: KeyboardEvent): void {
    this.commonService.onKeyCheck(value);
  }
}
