import { Component, OnInit } from '@angular/core';
import { CommonService } from 'client/app/common/common.service';
import { GameResult } from 'defs';
import { GameInfo, GameGroupDetailRes, TeamInfo } from 'defs/api';
import { ObjectId } from 'mongodb';

@Component({
  selector: 'app-tournament-detail',
  templateUrl: './tournament-detail.component.html',
  styleUrls: ['./tournament-detail.component.scss']
})
export class TournamentDetailComponent implements OnInit {

  /** 試合情報 */
  gameList: Pick<GameInfo, 'gameID' | 'gameInfCom' | 'teamInfo'>[];

  /** 試合結果情報 */
  gameResultList: Pick<GameResult, 'gameID' | 'groupID' | 'gameResult'>[];

  /** チーム情報 */
  teamList: TeamInfo[];

  /** トーナメント情報 */
  tournamentInfoList: {
    score: number | string;
    scorePK: number;
  }[][] = [];

  /** 試合情報(画面表示用) */
  gameLists: Pick<GameInfo, 'gameID' | 'gameInfCom' | 'teamInfo'>[][] = [];

  /** 3位決定戦情報 */
  thirdPlaceGame: {
    team: string;
    score: number | string;
    scorePK: number;
  }[] = [];

  /**
   * コンストラクタ
   * @param commonService
   */
  constructor(private commonService: CommonService) { }

  /**
   * 初期処理
   */
  public async ngOnInit(): Promise<void> {

    // 遷移元から情報の取得
    const editInfo = this.commonService.getEditInfo();

    try {

      // サーバーサイド処理
      const res: GameGroupDetailRes = await this.commonService.apiPost('game/getGameGroupInfo', editInfo).toPromise();

      // サーバーサイド処理結果判定
      if(res.result != 'ok') {
        await this.commonService.openNoticeDialog('エラー', res.message);
        this.commonService.navigateBack();
      }

      // 返却情報の設定
      this.gameList = res.gameList;
      this.gameResultList = res.gameResultList;
      this.teamList = res.teamList;

    } catch(e) {
      this.commonService.errorOnApi(e);
    }

    // 参加チームが2の何乗かを求める(トーナメントの列数となる)
    const logTeamCnt: number = Math.log2(this.gameList[0].gameInfCom.gameSystemInf.gameTeamCnt);

    // トーナメントの列数分ループし、画面表示用の配列を生成
    for (let i = 1; i <= logTeamCnt; i++) {
      // 配列を半分に切り取るためのインデックス取得
      const endIdx: number = Math.round(this.gameList.length / 2);

      // 配列を半分切り取りリストへ追加
      const gameList = this.gameList.slice(0, endIdx);
      this.gameLists.push(gameList);

      // 配列から切り取った要素を削除
      this.gameList.splice(0, endIdx);
    }

    // トーナメント表情報の生成を行う
    this.generateTournamentInfo();

    // 3位決定戦の情報があればここで設定する
    if(this.gameList.length != 0) {

      // 試合のチーム数分ループ
      for (const teamInfo of this.gameList[0].teamInfo) {

        // 試合結果の取得
        const gameResult = this.getGameResult(this.gameList[0].gameID, teamInfo.teamID);

        // 画面表示情報の格納
        this.thirdPlaceGame.push({
          team: teamInfo.teamID,
          score: (gameResult) ? gameResult.gameResult.scoreResult : '-',
          scorePK: (gameResult) ? gameResult.gameResult.scorePK : 0
        });
      }
    }
  }

  /**
   * 戻るボタン押下時の処理
   */
  public pageBack(): void {
    this.commonService.navigateBack();
  }

  /**
   * チームIDからチーム名を検索し返却する処理
   * @param teamID
   */
  public getTeamName(teamID: string): string {

    // 入力されたチームのIDに紐づくチームオブジェクトを設定
    const findResult = this.teamList.find((team) => {
      return team.teamID.toString() === teamID;
    });

    // 検索結果がある場合、チーム名を返却し、無い場合は空文字を返却
    if(findResult) {
      return findResult.teamName;
    } else {
      return '';
    }
  }

  /**
   * 勝利チームか判定を行う
   * @param game
   * @param teamID
   */
  public isWinner(game: Partial<GameInfo>, teamID: string): boolean {

    // チーム(自分)の得点を取得
    const gameResult = this.getGameResult(game.gameID, teamID);
    if(!gameResult) return false;

    // 相手チームの得点を取得
    const oppGameResult = this.gameResultList.find(gameRslt => {
      return gameRslt.gameID == game.gameID.toString()
        && gameRslt.groupID != teamID;
    });
    if(!oppGameResult) return false;

    // 勝敗の判定を行う
    if(gameResult.gameResult.scoreResult > oppGameResult.gameResult.scoreResult) {
      // 勝利の場合はtrue
      return true;

    } else if(gameResult.gameResult.scoreResult == oppGameResult.gameResult.scoreResult) {
      // 同点の場合はPKの点数で比較を行う
      if(gameResult.gameResult.scorePK > oppGameResult.gameResult.scorePK) {
        return true;
      } else {
        return false;
      }

    } else {
      // 負けの場合はfalse
      return false;
    }
  }

  /**
   * トーナメント表情報の生成を行う処理
   */
  private generateTournamentInfo(): void {

    // ラウンド数分のループを行う
    for (const gameList of this.gameLists) {
      const gameResults = [];

      // 試合数分のループを行う
      for (let i = 0; i < gameList.length; i++) {
        const game = gameList[i];
        const gameResultsTeam = [];

        // 試合チーム分のループを行う
        for (let idx = 0; idx < game.teamInfo.length; idx++) {
          const teamID = game.teamInfo[idx].teamID;

          // 試合結果の取得を行う
          const gameResult = this.getGameResult(game.gameID, teamID);

          // 試合結果がない場合ハイフンと0を設定
          if(!gameResult) {
            gameResultsTeam.push({
              score: '-',
              scorePK: 0
            });
          // 試合結果ありの場合、取得結果から得点とPK得点を設定
          } else {
            const tournamentInfo = {
              score: gameResult.gameResult.scoreResult,
              scorePK: gameResult.gameResult.scorePK
            };
            gameResultsTeam.push(tournamentInfo);
          }
        }
        // 1試合分の結果(2チーム分)を配列に格納
        gameResults.push(gameResultsTeam);
      }
      // 1ラウンド分の試合結果を格納
      this.tournamentInfoList.push(gameResults);
    }
  }

  /**
   * 試合結果を取得する処理
   * @param gameID
   * @param teamID
   */
  private getGameResult(gameID: ObjectId, teamID: string): Partial<GameResult> {

    // 試合結果を取得する
    const gameResult = this.gameResultList.find(gameResult => {
      return gameResult.gameID == gameID.toString()
        && gameResult.groupID == teamID;
    });

    // 試合結果を返却する
    return gameResult;
  }

}
