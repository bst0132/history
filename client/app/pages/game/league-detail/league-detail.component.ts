import { Component, OnInit } from '@angular/core';
import { CommonService } from 'client/app/common/common.service';
import { GameResult } from 'defs';
import { GameGroupDetailRes, TeamInfo, GameInfo } from 'defs/api';
import { MSG } from '../../../common/message-defines';

@Component({
  selector: 'app-league-detail',
  templateUrl: './league-detail.component.html',
  styleUrls: ['./league-detail.component.scss']
})
export class LeagueDetailComponent implements OnInit {

  /** チーム情報 */
  teamList: TeamInfo[];

  /** 試合情報 */
  gameList: Pick<GameInfo, 'gameID' | 'gameInfCom' | 'teamInfo'>[];

  /** 試合結果情報 */
  gameResultList: Pick<GameResult, 'gameID' | 'groupID' | 'gameResult'>[];

  /** 画面表示用チームIDリスト */
  teamIdList: string[] = [];

  /** リーグ情報(勝敗・得点)リスト */
  leagueInfoList: {
    team: string;
    oppTeam: string;
    result: string;
    oppResult: string;
    score: number;
    oppScore: number;
  }[] = [];

  /** 勝ち点リスト */
  pointList: number[] = [];

  /** 得失点リスト */
  diffPointList: number[] = [];

  /** 順位リスト */
  rankList: number[] = [];

  msg = MSG;

  /**
   * コンストラクタ
   * @param commonService
   */
  constructor(private commonService: CommonService) { }

  /**
   * 初期処理
   */
  public async ngOnInit(): Promise<void> {

    // 遷移元の引き継ぎ情報を受け取る
    const editInfo = this.commonService.getEditInfo();

    try {

      // サーバサイド処理
      const res: GameGroupDetailRes = await this.commonService.apiPost('game/getGameGroupInfo', editInfo).toPromise();

      // サーバーサイド処理結果判定
      if(res.result != 'ok') {
        await this.commonService.openNoticeDialog(this.msg.errTitle, res.message);
        this.commonService.navigateBack();
      }

      // 返却情報の設定
      this.teamList = res.teamList;
      this.gameList = res.gameList;
      this.gameResultList = res.gameResultList;
      this.teamIdList = res.teamIdList;

    } catch(e) {
      this.commonService.errorOnApi(e);
    }

    // リーグ表情報の生成
    for (let i = 0; i < this.gameList.length; i++) {
      this.generateLeagueInfo(i);
    }

    // 勝ち点の計算
    this.calcPoint();

    // 得失点の計算
    this.calcDiffPoint();

    // 順位の判定
    this.judgeRank();
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
   * 戻るボタン押下時の処理
   */
  public pageBack(): void {
    this.commonService.navigateBack();
  }

  /**
   * リーグ情報の取得
   * @param rowIdx
   * @param colIdx
   * @param selfFlg
   */
  public getLeagueInfo(rowIdx: number, colIdx: number, selfFlg: boolean): string {

    // チームの取得
    const team = this.teamIdList[rowIdx];
    const oppTeam = this.teamIdList[colIdx];

    // 自分側か相手側か判定し返却情報をコントロールする
    if(selfFlg) {
      // リーグ表情報の取得
      const leagueInfo = this.leagueInfoList.find(leagueInfo => {
        return leagueInfo.team == team && leagueInfo.oppTeam == oppTeam;
      });

      // 試合結果が取得出来ない場合は、結果なしを返却する
      if(!leagueInfo) return 'No Result';

      // リーグ表情報の返却
      return `${leagueInfo.result} ${leagueInfo.score} - ${leagueInfo.oppScore}`;

    } else {
      // リーグ表情報の取得
      const leagueInfo = this.leagueInfoList.find(leagueInfo => {
        return leagueInfo.oppTeam == team && leagueInfo.team == oppTeam;
      });

      // 試合結果が取得出来ない場合は、結果なしを返却する
      if(!leagueInfo) return 'No Result';

      // リーグ表情報の返却
      return `${leagueInfo.oppResult} ${leagueInfo.oppScore} - ${leagueInfo.score}`;
    }

  }

  /**
   * リーグ表情報の生成
   * @param index
   */
  private generateLeagueInfo(index: number): void {

    // 試合情報の取得
    const gameInfo = this.gameList[index];

    // 試合結果の取得
    const gameResult = this.gameResultList.find(gameRslt => {
      return gameRslt.gameID == gameInfo.gameID.toString()
        && gameRslt.groupID == gameInfo.teamInfo[0].teamID;
    });

    // 得点の取得
    if(!gameResult) return;
    const score = gameResult.gameResult.scoreResult;

    // 試合結果の取得(相手側)
    const oppGameResult = this.gameResultList.find(gameRslt => {
      return gameRslt.gameID == gameInfo.gameID.toString()
        && gameRslt.groupID == gameInfo.teamInfo[1].teamID;
    });

    // 得点の取得(相手側)
    if(!oppGameResult) return;
    const oppScore = oppGameResult.gameResult.scoreResult;

    // 勝敗を判定
    const result: string = (score > oppScore) ? '◯' : (score == oppScore) ? '△' : '✕';
    const oppResult: string = (result == '◯') ? '✕' : (result == '△') ? '△' : '◯';

    // リーグ表情報の格納
    this.leagueInfoList.push({
      team: gameResult.groupID,
      oppTeam: oppGameResult.groupID,
      result: result,
      oppResult: oppResult,
      score: score,
      oppScore: oppScore
    });
  }

  /**
   * 勝ち点を計算する
   */
  private calcPoint(): void {

    // 参加チーム分ループ
    this.teamIdList.forEach(teamID => {
      const pointList: number[] = [];

      // チームIDが一致する試合を抽出
      const games = this.gameList.filter(game => {
        return game.teamInfo[0].teamID == teamID || game.teamInfo[1].teamID == teamID;
      });
      for (let i = 0; i < games.length; i++) {
        // 試合IDとチームIDが一致する試合結果を抽出
        const gameResult = this.gameResultList.find(gameResult => {
          return gameResult.gameID == games[i].gameID.toString() && gameResult.groupID == teamID;
        });
        if(!gameResult) continue;
        const score = gameResult.gameResult.scoreResult;

        // 試合IDが一致するかつ、チームIDが不一致の試合結果(対戦相手のデータ)を抽出
        const oppGameResult = this.gameResultList.find(gameResult => {
          return gameResult.gameID == games[i].gameID.toString() && gameResult.groupID != teamID;
        });
        if(!oppGameResult) continue;
        const oppScore = oppGameResult.gameResult.scoreResult;

        // 勝ち点の判定をし、リストへ格納
        const point: number = (score > oppScore) ? 3 : (score == oppScore) ? 1 : 0;
        pointList.push(point);
      }

      // 勝ち点の合計を算出しリストへ格納
      const sumPoint = pointList.reduce((prev, curval) => prev + curval, 0);
      this.pointList.push(sumPoint);
    });
  }

  /**
   * 得失点を計算する
   */
  private calcDiffPoint(): void {

    // 参加チームの分ループ
    this.teamIdList.forEach(teamID => {

      // チームIDが一致する試合結果だけ抽出
      const gameRslt = this.gameResultList.filter(gameRslt => {
        return gameRslt.groupID == teamID;
      });

      // 得点の合計を算出
      const totalScore = gameRslt.reduce((prev, curval) => {
        return prev + curval.gameResult.scoreResult;
      }, 0);

      // チームIDが一致する試合を抽出
      const oppGameList = this.gameList.filter(game => {
        return game.teamInfo[0].teamID == teamID || game.teamInfo[1].teamID == teamID;
      });

      // 試合IDが一致するかつ、チームIDが異なる試合結果を取得し、点数を加算
      let totalLostPoint = 0;
      for (let i = 0; i < oppGameList.length; i++) {
        const gameRslt = this.gameResultList.find(gameRslt => {
          return gameRslt.gameID == oppGameList[i].gameID.toString()
            && gameRslt.groupID != teamID;
        });
        if(!gameRslt) continue;
        totalLostPoint += gameRslt.gameResult.scoreResult;
      }

      // 得失点差をリストへ格納
      this.diffPointList.push(totalScore - totalLostPoint);
    });
  }

  /**
   * 順位を判定する
   */
  private judgeRank(): void {

    // ソートは破壊的メソッドなので、リストのコピーを生成
    const sortedList = this.pointList.concat();

    // コピーしたリストを降順にソート
    sortedList.sort((x, y) => y - x);

    // 順位をインデックスから割り出す
    this.pointList.forEach(point => {
      const rank = sortedList.indexOf(point) + 1;
      this.rankList.push(rank);
    });
  }

}
