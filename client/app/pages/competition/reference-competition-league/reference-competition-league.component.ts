import { Component, OnInit } from '@angular/core';
import { MSG } from 'client/app/common/message-defines';
import { CommonService } from 'client/app/common/common.service';
import { CNS, gameProgressStatuses } from 'client/app/common/defines';
import { ObjectId } from 'mongodb';
import { ParticipatingTeamListInfo, GetGameGroupsRes } from 'defs/api';
import { TeamGameRecord } from 'defs/entity';
import { ActivatedRoute, Params, Router } from '@angular/router';

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

interface gameGroupInf {
  /** 試合年月日 */
  gameDate?: string;
  /** 試合会場 */
  gamePlace?: string;
  /** 試合開始時間：時 */
  startTimeHour?: number;
  /** 試合開始時間：分 */
  startTimeMinute?: number;
  /** 試合ID */
  gameId: number;
  /** 基準チーム記録ID */
  criteriaRecordId?: ObjectId;
  /** 基準チーム得点 */
  criteriaScore?: number;
  /** 基準チームID */
  criteriaTeamId?: ObjectId;
  /** 基準チーム名 */
  criteriaTeamName?: string;
  /** 対戦チーム記録ID */
  opponentRecordId?: ObjectId;
  /** 対戦チーム得点 */
  opponentScore?: number;
  /** 対戦チームID */
  opponentTeamId?: ObjectId;
  /** 対戦チーム名 */
  opponentTeamName?: string;
  /** 試合経過状況 */
  gameProgressStatus?: '1' | '2' | '3';
}

@Component({
  selector: 'app-reference-competition-league',
  templateUrl: './reference-competition-league.component.html',
  styleUrls: ['./reference-competition-league.component.scss']
})
export class ReferenceCompetitionLeagueComponent implements OnInit {  // 試合グループ情報のフォームグループ

  msg = MSG;

  cns = CNS;

  encryptedCompId: string;
  encryptedDate: string;
  encryptedGameId: string;

  gameProgressStatuses = gameProgressStatuses;

  // formgroupを使用しないため変数を設定
  gameGroupId: string;
  compId: string;
  gameSystem: string;
  gameGroupTitle: string;
  teamCount: number;
  groupPlaceNum: number;
  rank: number[] = [];
  gameGroupInf: gameGroupInf[] = [];
  selectedTeam: TeamGameRecord[] = [];

  // 連想配列取得用
  indexOfArray = 0;

  winningPointInf: {
    winPoint?: number;
    drawPoint?: number;
    losePoint?: number;
  };

  // テーブル内セル押下後の情報表示制御
  canShow = false;

  viewFlg: 'top' | 'left';

  date = '';

  // 参加チーム数格納用
  teamNumber: number[];

  // 配列要素番号管理用
  arrayNumber: number;

  // リーグ表の行と列の要素番号管理用
  leagueArray: number[][] = [];

  rowControl: number;

  columnControl: number;

  // teamGameRecord取得I用D格納用
  recordIdArray: ObjectId[] = [];

  // teamGameRecord取得データ格納用
  teamGameRecord: TeamGameRecord[] = [];

  // ソート後teamGameRecord格納用
  sortedTeamGameRecord: TeamGameRecord[] = [];

  // チーム別成績格納用
  teamStats: TeamStats[] =[];

  // 選択されたチーム名格納用(一旦仮で設定、後々変更する可能性大)
  selectedTeamName: string[] = [];

  // デバイス判定用変数
  device: 'pc' | 'sp';

  // 共通コンポーネントに渡すデータ
  leagueData: {
      gameGroupTitle: string,
      teamCount: number,
      rank: number[],
      gameGroupInf: gameGroupInf[],
      selectedTeam: TeamGameRecord[],
      selectedTeamName: string[],
      winningPointInf,
      teamStats: TeamStats[],
      arrayNumber: number,
      leagueArray: number[][]
    };

  // 大会参加チームのデータ
  entryTeamList: ParticipatingTeamListInfo[];

  constructor(public commonService: CommonService, private route: ActivatedRoute, public router: Router) {

    // デバイス判定
    this.device = commonService.isMobile ? 'sp' : 'pc';

    // 12チームまでチーム数を設定
    this.teamNumber = [...Array(10)].map((_: undefined, index: number) => index);
  }

  /**
   * 初期処理
   */
  public async ngOnInit(): Promise<void> {

    this.route.queryParams.subscribe((params: Params) => {
      this.encryptedCompId = params.param1;
      this.encryptedDate = params.param2;
      this.encryptedGameId = params.param3;
      this.winningPointInf = {winPoint: params.param4, drawPoint: params.param5, losePoint: params.param6};
    });

    // 遷移元から引き継ぎ情報（大会ID、有効期限、試合ID）を受け取り、異常があればログイン画面へ遷移する
    if (this.encryptedCompId === '' || this.encryptedDate === '' || this.encryptedGameId === '' || this.winningPointInf === null) {
      this.commonService.navigateToLoginFromRef();
      return;
    }

    try {
      // 大会参加チーム取得処理
      const res = await this.commonService.apiPost('teamGameRecord/getParticipatingTeamListForGuest', {compId: this.encryptedCompId.toString()}).toPromise();

      // 異常があれば大会要綱画面・スケジュールタブに戻る
      if (res.result != 'ok') {
        await this.commonService.errorOnApp();
        this.navigateReferenceCompetitionGuide();
        return;
      } else {
        // 取得した参加チームをentryTeamListに設定
        this.entryTeamList = res.participatingTeamList;
      }
    } catch(e) {
      await this.commonService.errorOnService(CNS.targetTypeGameTeam, CNS.actionTypeGet);
      this.navigateReferenceCompetitionGuide();
      return;
    }

    // gameGroupsのDB情報取得用
    let res: GetGameGroupsRes;

    try {
      // 試合情報の取得処理
      res = await this.commonService.apiPost('gameInf/getGameGroupInfoForGuest', {gameId: this.encryptedGameId.toString()}).toPromise();
      // 異常があれば大会要綱画面・スケジュールタブに戻る
      if (res.result != 'ok') {
        await this.commonService.errorOnApp();
        this.navigateReferenceCompetitionGuide();
        return;
      }
    } catch (e) {
      await this.commonService.errorOnService(CNS.targetTypeGame + CNS.targetTypeInformation, CNS.actionTypeGet);
      this.navigateReferenceCompetitionGuide();
      return;
    }

    try {
      // teamGameRecordデータ取得処理
      const res = await this.commonService.apiPost('teamGameRecord/getTeamGameRecord', {
        recordIds: this.entryTeamList.map(entry => entry.recordId.toString())
      }).toPromise();
      // データ格納
      this.teamGameRecord = res.teamGameRecordRes;

    } catch(e) {
      await this.commonService.errorOnService(CNS.targetTypeGame + CNS.targetTypeInformation, CNS.actionTypeGet);
      this.navigateReferenceCompetitionGuide();
      return;
    }

    // 配列以外の試合情報の値を設定
    this.gameGroupId = res.gameId;
    this.compId = res.gameGroupInfo.compId;
    this.gameSystem = res.gameGroupInfo.gameSystem;
    this.gameGroupTitle = res.gameGroupInfo.gameGroupTitle;
    this.teamCount = res.gameGroupInfo.teamCount;
    this.groupPlaceNum = res.gameGroupInfo.groupPlaceNum;

    // 空の配列を設定
    this.makeStorageArray(this.teamCount);

    // 各試合情報の配列情報を設定
    this.gameGroupInf.map((baseElm) => {
      for (const resElm of res.gameGroupInfo.gameGroupInf) {
        // 試合配置番号が一致する場合のみデータ格納処理を行う
        if (resElm.gameId !== baseElm.gameId) {
          continue;
        }
        // 時間を「時」と「分」に分ける
        const hour = resElm.gameStartTime !== undefined ? Math.floor(resElm.gameStartTime / 100) : null;
        const minute = resElm.gameStartTime !== undefined ? resElm.gameStartTime % 100 : null;
        // 各試合情報を設定する
        this.gameGroupInf[this.indexOfArray].gameDate = resElm?.gameDate;
        this.gameGroupInf[this.indexOfArray].gamePlace = resElm?.gamePlace;
        this.gameGroupInf[this.indexOfArray].startTimeHour = hour;
        this.gameGroupInf[this.indexOfArray].startTimeMinute = minute;
        this.gameGroupInf[this.indexOfArray].criteriaRecordId = resElm?.criteriaRecordId ? resElm.criteriaRecordId : null;
        this.gameGroupInf[this.indexOfArray].criteriaScore = resElm?.criteriaScore != null ? resElm.criteriaScore : null;
        this.gameGroupInf[this.indexOfArray].opponentRecordId = resElm?.opponentRecordId ? resElm.opponentRecordId : null;
        this.gameGroupInf[this.indexOfArray] .opponentScore= resElm?.opponentScore != null ? resElm.opponentScore : null;
        this.gameGroupInf[this.indexOfArray].gameProgressStatus = resElm?.gameProgressStatus;

        this.indexOfArray++;
      }
    });

    // リーグ表タイトル欄と各セルにチーム情報を設定する
    for (let i = 0; i < this.teamCount; i++) {
      let recordId: ObjectId;
      if (i === 0) {
        recordId = this.gameGroupInf[i].opponentRecordId;
      } else {
        recordId = this.gameGroupInf[i-1].criteriaRecordId;
      }

      if (recordId) {
        // リーグ表タイトル欄にチーム情報を設定
        this.selectedTeam[i].teamId = recordId;
        // 各セルにチーム情報を設定
        this.onChangeSetValue(i, recordId);
      } else {
        this.selectedTeamName[i] ='';
      }
      this.recordIdArray.push(recordId);
    }

    // リーグ表タイトル欄のrecordIdの順番に基づいてteamGameRecordを並び替える
    this.sortedTeamGameRecord = this.recordIdArray.map((recordId) => {
      return this.teamGameRecord.find((record) => record._id === recordId);
    });

    // 各チーム毎の試合成績を集計しteamStatsに格納
    this.teamStats = this.sortedTeamGameRecord.map((record) => {
      const newTeam = {
        rank: null,
        winningPoints: 0,
        totalWin: 0,
        totalLost: 0,
        totalDrew: 0,
        totalScore: 0,
        totalLoss: 0
      };

      if(record === undefined){
        return newTeam;
      }

      const game = record.gameRecord?.find((game) => game.gameGroupId === this.gameGroupId);

      if (game) {
        newTeam.rank = game.rank;
        for (const perGameInf of game.perGameInf) {
          newTeam.totalWin += perGameInf.isWon || 0;
          newTeam.totalLost += perGameInf.isLost || 0;
          newTeam.totalDrew += perGameInf.isDrew || 0;
          newTeam.totalScore += perGameInf.score || 0;
          newTeam.totalLoss += perGameInf.loss || 0;
        }
        // 遷移元から引き継いだ勝ち点情報をもとに勝ち点を計算（もし勝ち点情報が存在しない場合は0を表示させる）
        if (!this.winningPointInf) {
          newTeam.winningPoints = 0;
        } else {
          newTeam.winningPoints = (newTeam.totalWin * this.winningPointInf.winPoint) + (newTeam.totalLost * this.winningPointInf.losePoint) + (newTeam.totalDrew * this.winningPointInf.drawPoint);
        }
      }

      return newTeam;
    });

    // 順位情報を設定
    for (let i = 0; i < this.teamStats.length; i++) {
      this.rank[i] = this.teamStats[i].rank;
    }

    // 共通コンポーネントに渡すデータを整形
    this.leagueData = {
      gameGroupTitle: this.gameGroupTitle,
      teamCount: this.teamCount,
      rank: this.rank,
      gameGroupInf: this.gameGroupInf,
      selectedTeam: this.selectedTeam,
      selectedTeamName: this.selectedTeamName,
      winningPointInf: this.winningPointInf,
      teamStats: this.teamStats,
      arrayNumber: this.arrayNumber,
      leagueArray: this.leagueArray
    };

  }

  /**
   * チーム数に応じてデータ格納用の配列を生成する
   * @param count
   */
  public makeStorageArray(count: number): void { // 修正
    this.canShow = false;

    // 試合数分の配列を作成
    const controlNumber = (Math.pow(count, 2) - count) / 2;
    for (let row = 0; row < controlNumber; row++) {

      this.gameGroupInf.push({
        gameDate: '',
        gamePlace: '',
        startTimeHour: null,
        startTimeMinute: null,
        gameId: row,
        criteriaRecordId: null,
        criteriaScore: null,
        criteriaTeamId: null,
        criteriaTeamName: '',
        opponentRecordId: null,
        opponentScore: null,
        opponentTeamId: null,
        opponentTeamName: '',
        gameProgressStatus: CNS.beforeGame
      });
    }

    // 参加しているチームのrecordIdを持つ配列をチーム数分作成
    for (let i = 0; i < count; i++) {
      this.selectedTeam.push({
        compId: null,
        teamId: null,
        teamName: null,
        gameRecord: [{
          gameGroupId: '',
          rank: null,
          perGameInf: [{
            gameId: null,
            isWon: null,
            isDrew: null,
            isLost: null,
            score: null,
            loss: null
          }]
        }],
        docIsValid: false,
        docCreUserID: '',
        docCreTimeStamp: '',
        docModUserID: '',
        docModTimeStamp: ''
      });
    }

    // 順位用配列をチーム数分作成
    for (let i = 0; i < count; i++) {
      this.rank.push(null);
    }

    // リーグ表用の配列作成メソッドの呼び出し
    this.makeLeagueArray(count);
  }

  /**
   * 参加しているチーム数に応じた試合IDを保持した二次元配列を作成
   * @param teamCount
   */
  public makeLeagueArray(teamCount: number): void {
    this.leagueArray = [];
    // チーム数に応じて元となる配列を上から順に作成(行作成)
    for (let i = 0; i < teamCount; i++) {
      const columnArray: number[] = [];
      // 行ごとに作成された配列の中に、チーム数に応じて配列を左から順に作成(列作成)
      for (let j = 0; j < teamCount; j++) {
        columnArray.push(this.getGameNumber(i, j, teamCount));
      }
      // 作成された試合IDを保持した二次元配列はleagueArrayで取得し、columnArrayには試合IDが保持される
      this.leagueArray.push(columnArray);
    }
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
   * チーム選択後、リーグ表セル内にチーム情報を設定(本来引数のvalueはObjectId型)
   * @param number
   * @param value
   */
  public onChangeSetValue(number: number, value: ObjectId): void {
    // recordIdが一致するチームの情報を取得
    const teamInfo = this.entryTeamList.find(elm => elm.recordId == value);
    // rowNo部分のツールチップに表示させるチーム名を格納(仮の処理、後々変更する可能性大)
      this.selectedTeamName[number] = teamInfo.teamName;
    // 試合配置番号を取得
    const controlFirstNumber = this.getGameNumber(number, number + 1, this.teamCount);

    // 該当するセルにチーム情報を設定(斜線より右上側の部分)
    for (let i = 0; i < this.teamCount - (number + 1); i++) {
      const controlNumber = controlFirstNumber + i;
      this.gameGroupInf[controlNumber].opponentRecordId = teamInfo.recordId;
      this.gameGroupInf[controlNumber].opponentTeamId = teamInfo?.teamId;
      this.gameGroupInf[controlNumber].opponentTeamName = teamInfo.teamName;
    }
    // 該当するセルにチーム情報を設定(斜線より左下側の部分)
    if (number > 0) {
      for (let i = 0; i < number; i++) {
        const setNumber = this.getGameNumber(number, i, this.teamCount);
        this.gameGroupInf[setNumber].criteriaRecordId = teamInfo.recordId;
        this.gameGroupInf[setNumber].criteriaTeamId = teamInfo?.teamId;
        this.gameGroupInf[setNumber].criteriaTeamName = teamInfo.teamName;
      }
    }
  }

  /**
   * 戻るボタン
   */
  public onClickBack(): void {

    // 大会要綱画面・スケジュールタブに戻る
    this.navigateReferenceCompetitionGuide();
  }

  /**
 * 参照用大会要綱画面・スケジュールタブへの遷移処理
 */
  public navigateReferenceCompetitionGuide(): void {
    const queryParams = {params1: this.encryptedCompId, params2: this.encryptedDate, tab: 'schedule'};

    this.commonService.navigateForRef(CNS.pathToReferenceCompetitionGuide, queryParams);
  }
}
