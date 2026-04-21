import { Component, OnInit } from '@angular/core';
import { AbstractControl, UntypedFormArray, UntypedFormBuilder, UntypedFormGroup, Validators } from '@angular/forms';
import { CommonService } from 'client/app/common/common.service';
import { Competition, GameResult } from 'defs';
import { GameInfo, GameGroupDetailRes, TeamInfo } from 'defs/api';
import { ObjectId } from 'mongodb';
import { EditPageBase } from '../../EditPageBase';
import { MSG } from '../../../common/message-defines';

@Component({
  selector: 'app-edit-tournament',
  templateUrl: './edit-tournament.component.html',
  styleUrls: ['./edit-tournament.component.scss']
})
export class EditTournamentComponent extends EditPageBase implements OnInit {

  /**
   * コンストラクタ
   * @param commonService
   * @param formBuilder
   */
  constructor(public commonService: CommonService, private formBuilder: UntypedFormBuilder) {
    // 基底クラスのコンストラクタを呼び出す
    super(commonService);

    // フォームの生成
    this.formGroup = this.formBuilder.group({
      formList: this.formBuilder.array([])
    });

    // モーダル表示OFFに設定
    this.isShowModal = false;
  }

  /** 試合情報 */
  gameList: Pick<GameInfo, 'gameID' | 'gameInfCom' | 'teamInfo'>[];

  /** 試合結果情報 */
  gameResultList: Pick<GameResult, 'gameID' | 'groupID' | 'gameResult'>[];

  /** チーム情報 */
  teamList: TeamInfo[];

  /** 大会参加チーム */
  partTeam: Pick<Competition, 'teamID'>;

  /** トーナメント情報 */
  tournamentInfoList: {
    score: number | string;
    scorePK: number;
  }[][] = [];

  /** 試合情報(画面表示用) */
  gameLists: Pick<GameInfo, 'gameID' | 'gameInfCom' | 'teamInfo'>[][] = [];

  /** 3位決定戦情報 */
  thirdPlaceGame: {
    gameID: ObjectId;
    team: string;
    score: number | string;
    scorePK: number;
  }[] = [];

  /** フォームグループ */
  formGroup: UntypedFormGroup;

  /** モーダル表示のフラグ */
  isShowModal: boolean;

  /** 正規表現パターン(半角数字) */
  private patternNum = /^([1-9]\d*|0)$/;

  msg = MSG;

  /** チームセレクトボックス */
  teamSelectList: string[][] = [];

  /**
   * 初期状態からページの編集がされたか判定する
   * 基底クラスの抽象メソッドの実装
   */
  public canDeactive(): boolean {
    return !this.formGroup.dirty;
  }

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
        await this.commonService.openNoticeDialog(this.msg.errTitle, res.message);
        this.commonService.navigateBack();
      }

      // 返却情報の設定
      this.gameList = res.gameList;
      this.gameResultList = res.gameResultList;
      this.teamList = res.teamList;
      this.partTeam = res.partTeam;

    } catch(e) {
      this.commonService.errorOnApi(e);
    }

    // 参加チームが2の何乗かを求める(トーナメントの列数となる)
    const logTeamCnt: number = Math.log2(this.gameList[0].gameInfCom.gameSystemInf.gameTeamCnt);

    // 試合情報のコピーを作成(コピーを操作し、オリジナルの値は保持したいので)
    const cpGameList = this.gameList.concat();

    // トーナメントの列数分ループし、画面表示用の配列を生成
    for (let i = 1; i <= logTeamCnt; i++) {
      // 配列を半分に切り取るためのインデックス取得
      const endIdx: number = Math.round(cpGameList.length / 2);

      // 配列を半分切り取りリストへ追加
      const gameList = cpGameList.slice(0, endIdx);
      this.gameLists.push(gameList);

      // 配列から切り取った要素を削除
      cpGameList.splice(0, endIdx);
    }

    // トーナメント表情報の生成を行う
    this.generateTournamentInfo();

    // 3位決定戦の情報があればここで設定する
    if(cpGameList.length != 0) {

      // 試合のチーム数分ループ
      for (const teamInfo of cpGameList[0].teamInfo) {

        // 試合結果の取得
        const gameResult = this.getGameResult(cpGameList[0].gameID, teamInfo.teamID);

        // 画面表示情報の格納
        this.thirdPlaceGame.push({
          gameID: cpGameList[0].gameID,
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
   * トーナメントカード押下時のイベント
   * モーダル情報の設定と、モーダル表示を行う
   * @param gameID
   */
  public onClickCard(gameID: ObjectId): void {

    // 試合情報の取得
    const game = this.gameList.find(game => game.gameID == gameID);
    // 試合情報が存在しない場合、ダイアログを表示して終了
    if(!game) {
      this.commonService.openNoticeDialog(this.msg.errTitle, this.msg.getErr.replace('※1','試合情報'));
      return;
    }

    // formArrayの取得と初期化
    const formArray: UntypedFormArray = this.formGroup.get('formList') as UntypedFormArray;
    formArray.clear();

    // チームセレクトボックスの初期化
    this.teamSelectList.length = 0;

    // 前試合IDが存在する場合、前試合の参加チームをセレクトボックスに設定
    if(game.gameInfCom.gameSystemInf.preGameID) {
      for (const gameID of game.gameInfCom.gameSystemInf.preGameID) {
        const game = this.gameList.find(game => gameID == game.gameID.toString());
        const team = game.teamInfo.map(team => team.teamID);
        this.teamSelectList.push(team);
      }
    } else {
      for (let i = 0; i < 2; i++) {
        // 大会参加チームをセレクトボックスのリストとして設定
        this.teamSelectList.push(this.partTeam.teamID);
      }
    }

    // チーム情報の分ループで試合結果を取得
    game.teamInfo.forEach(team => {
      const gameResult = this.getGameResult(gameID, team.teamID);

      // フォームに取得した値を設定する
      if(gameResult) {
        formArray.push(this.formBuilder.group({
          gameID: game.gameID,
          team: team.teamID,
          teamBk: team.teamID,
          score1stHalf: [gameResult.gameResult.score1stHalf, [Validators.required, Validators.pattern(this.patternNum), Validators.max(99)]],
          score2ndHalf: [gameResult.gameResult.score2ndHalf, [Validators.required, Validators.pattern(this.patternNum), Validators.max(99)]],
          scoreEX1stHalf: [gameResult.gameResult.scoreEX1stHalf, [Validators.required, Validators.pattern(this.patternNum), Validators.max(99)]],
          scoreEX2ndHalf: [gameResult.gameResult.scoreEX2ndHalf, [Validators.required, Validators.pattern(this.patternNum), Validators.max(99)]],
          totalScore: [0, [Validators.required, Validators.pattern(this.patternNum)]],
          scorePK: [gameResult.gameResult.scorePK, [Validators.required, Validators.pattern(this.patternNum), Validators.max(99)]]
        }));
      } else {
        // 試合結果が取得出来ない場合、チーム名のみ設定し、点数は0とする
        formArray.push(this.formBuilder.group({
          gameID: game.gameID,
          team: team.teamID,
          teamBk: team.teamID,
          score1stHalf: [0, [Validators.required, Validators.pattern(this.patternNum), Validators.max(99)]],
          score2ndHalf: [0, [Validators.required, Validators.pattern(this.patternNum), Validators.max(99)]],
          scoreEX1stHalf: [0, [Validators.required, Validators.pattern(this.patternNum), Validators.max(99)]],
          scoreEX2ndHalf: [0, [Validators.required, Validators.pattern(this.patternNum), Validators.max(99)]],
          totalScore: [0, [Validators.required, Validators.pattern(this.patternNum)]],
          scorePK: [0, [Validators.required, Validators.pattern(this.patternNum), Validators.max(99)]]
        }));
      }
    });

    // モーダルを表示する
    this.isShowModal = true;
  }

  /**
   * モーダルを閉じる
   */
  public closeModal(): void {
    // モーダルを非表示にする
    this.isShowModal = false;
  }

  /**
   * 更新ボタン押下時の処理
   */
  public async editTournamentInfo(): Promise<void> {

    // フォームの情報を設定
    const form = this.formGroup.value;

    // ダイアログ表示
    const dialog = await this.commonService.openConfirmDialog(this.msg.confirmationTitle, this.msg.updateConfirmation.replace('※1','トーナメント情報'));

    // キャンセルなら処理中断
    if(!dialog) {
      return;
    }

    try {
      // トーナメント情報更新処理
      const res = await this.commonService.apiPost('game/editTournament', {
        form: form,
        compID: this.commonService.getEditInfo().id
      }).toPromise();

      // サーバーサイド処理結果判定
      if(res.result == 'ok') {
        await this.commonService.openNoticeDialog(this.msg.updateDoneTitle, this.msg.updateDone.replace('※1','トーナメント情報'));
        // フォームの変更状態をもとに戻す
        this.formGroup.markAsPristine();
        // 画面情報の更新
        this.isShowModal = false;
        document.location.reload();
      } else {
        await this.commonService.openNoticeDialog(this.msg.errTitle, this.msg.updateErr.replace('※1','トーナメント情報'));
      }

    } catch(e) {
      this.commonService.errorOnApi(e);
    }
  }

  /**
   * 合計点数の計算を行う
   * @param form
   */
  public calcScore(form: AbstractControl): void {

    // フォームから数値のみ取り出す
    const scoreList: number[] = Object.entries(form.value).map(([k, v]) => {

      // 得点集計対象のキーリスト
      const keyList: string[] = ['score1stHalf', 'score2ndHalf', 'scoreEX1stHalf', 'scoreEX2ndHalf'];
      // キーリストにある項目以外なら集計対象ではないため0を返す
      if(!keyList.includes(k)) return 0;

      // 型がnumberの場合そのまま返却
      if(typeof v == 'number') {
        return v;
      } else if(typeof v == 'string') {
        // 型がstringであれば、パターンに一致する値は数値変換
        if(this.patternNum.test(v)) return parseInt(v);
      }
      // 上記パターン以外は0が返る
      return 0;
    });

    // 合計点数を算出し設定
    form.get('totalScore').setValue(scoreList.reduce((prev, cur) => prev + cur, 0));
  }

  /**
   * チームセレクトボックスが全て空文字か判定を行う
   * @param teamList
   */
  public isEmptyTeamList(teamList: string[]): boolean {
    return teamList.every(team => !team);
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

  /** formListのgetter */
  get formList(): UntypedFormArray {
    return this.formGroup.get('formList') as UntypedFormArray;
  }

}
