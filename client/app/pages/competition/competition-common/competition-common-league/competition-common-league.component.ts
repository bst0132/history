import { Component, Input } from '@angular/core';
import { CNS } from 'client/app/common/defines';
import { MSG } from 'client/app/common/message-defines';
import { TeamGameRecord } from 'defs/entity';
import { CommonService } from 'client/app/common/common.service';

interface TeamStats {
  /** 順位 */
  rank?: number;
  /** 勝ち点 */
  winningPoints?: number;
  /** 合計勝利数 */
  totalWin?: number;
  /** 合計敗北数 */
  totalLost?: number;
  /** 合計引き分け数 */
  totalDrew?: number;
  /** 合計得点 */
  totalScore?: number;
  /** 合計失点 */
  totalLoss?: number;
}

@Component({
  selector: 'app-competition-common-league',
  templateUrl: './competition-common-league.component.html',
  styleUrls: ['./competition-common-league.component.scss']
})
export class CompetitionCommonLeagueComponent {

  constructor(public commonService: CommonService) {
    // デバイス判定
    this.device = this.commonService.getDevice();
  }

  // 定数使用用変数
  cns = CNS;
  msg = MSG;

  // 受け取るデータ
  @Input() leagueData: {
    gameGroupTitle: string,
    teamCount: number,
    rank: number[],
    gameGroupInf: [{
      gameDate: string,
      gamePlace: string,
      startTimeHour: number,
      startTimeMinute: number | string,
      gameId,
      criteriaRecordId,
      criteriaScore: number,
      criteriaTeamId,
      opponentRecordId,
      opponentScore: number,
      opponentTeamId,
      gameProgressStatus: string,
      criteriaTeamName: string,
      opponentTeamName: string
    }],
    selectedTeam: TeamGameRecord[],
    selectedTeamName: string[],
    winningPointInf,
    teamStats: TeamStats[],
    arrayNumber: number,
    leagueArray: number[][]
  };

  // テーブル内セル押下後の情報表示制御
  canShow = false;

  viewFlg: 'top' | 'left';

  rowControl: number;

  columnControl: number;

  // デバイス判定用変数
  device: 'pc' | 'sp';

  /**
   * 初期処理
   */
  public ngOnInit(): void {
    /**
     * 分の変換は後々リファクタリングを検討する
     * pipeのtimeNumberToStringを使うなど
     */
    // 分を'mm'の形にする
    for(let i = 0; i < this.leagueData.gameGroupInf.length; i++) {
      // startTimeMinute null判定
      if (this.leagueData.gameGroupInf[i].startTimeMinute !== null) {
        this.leagueData.gameGroupInf[i].startTimeMinute = this.leagueData.gameGroupInf[i].startTimeMinute.toString().padStart(2,'0');
      }
    }
  }

  // ヘルプボタンを押下した際の処理
  public async onClickHelp(): Promise<void> {
    // 確認ダイアログ表示
    await this.commonService.openNoticeDialog(this.msg.helpTitle, this.msg.helpForLeague);
  }

      /**
   * リーグ表下部に表示する入力項目を設定する
   * @param rowIdx
   * @param columnIdx
   * @param teamNumber
   */
  public onClickCell(rowIdx: number, columnIdx: number, teamNumber: number): void {
    this.canShow = true;
    this.leagueData.arrayNumber = this.getGameNumber(rowIdx, columnIdx, teamNumber);
    if (columnIdx > rowIdx) {
      this.viewFlg = 'top';
    }
    else if (columnIdx < rowIdx) {
      this.viewFlg = 'left';
    }
    else {
      this.canShow = false;
    }
    this.rowControl = rowIdx;
    this.columnControl = columnIdx;
  }

    /**
   * 行番号、列番号、参加チーム数からリーグ表内に割り当てた試合配置番号を算出して返す
   * @param rowIdx
   * @param columnIdx
   * @param teamNumber
   * @returns
   */
    public getGameNumber(rowIdx: number, columnIdx: number, teamNumber: number): number {
      if (columnIdx > rowIdx) {
        return columnIdx - 1 - 1 / 2 * rowIdx * (rowIdx + 1) + (teamNumber - 1) * rowIdx;
      }
      else if (columnIdx < rowIdx) {
        return rowIdx - 1 - 1 / 2 * columnIdx * (columnIdx + 1) + (teamNumber - 1) * columnIdx;
      }
      else {
        return;
      }
    }

  /**
   * Enterキー・スペースキー押下時にクリックイベント発火
   */
  public onKeyCheck(value: KeyboardEvent): void {
    this.commonService.onKeyCheck(value);
  }
}
