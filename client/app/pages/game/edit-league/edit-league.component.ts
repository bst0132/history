import { Component, OnInit } from '@angular/core';
import { UntypedFormBuilder, UntypedFormGroup, Validators } from '@angular/forms';
import { CommonService } from 'client/app/common/common.service';
import { GameResult } from 'defs';
import { GameGroupDetailRes, TeamInfo, GameInfo } from 'defs/api';
import { EditPageBase } from '../../EditPageBase';
import { MSG } from '../../../common/message-defines';

@Component({
  selector: 'app-edit-league',
  templateUrl: './edit-league.component.html',
  styleUrls: ['./edit-league.component.scss']
})
export class EditLeagueComponent extends EditPageBase implements OnInit {

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

  /** フォームグループ */
  formGroup: UntypedFormGroup;

  /** モーダル表示のフラグ */
  isShowModal: boolean;

  /** 正規表現パターン(半角数字) */
  private patternNum = /^([1-9]\d*|0)$/;

  msg = MSG;

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
      teamForm: this.formBuilder.group({
        gameID: [''],
        team: [''],
        score1stHalf: [0, [Validators.required, Validators.pattern(this.patternNum), Validators.max(99)]],
        score2ndHalf: [0, [Validators.required, Validators.pattern(this.patternNum), Validators.max(99)]],
        scoreEX1stHalf: [0, [Validators.required, Validators.pattern(this.patternNum), Validators.max(99)]],
        scoreEX2ndHalf: [0, [Validators.required, Validators.pattern(this.patternNum), Validators.max(99)]]
      }),
      oppTeamForm: this.formBuilder.group({
        gameID: [''],
        team: [''],
        score1stHalf: [0, [Validators.required, Validators.pattern(this.patternNum), Validators.max(99)]],
        score2ndHalf: [0, [Validators.required, Validators.pattern(this.patternNum), Validators.max(99)]],
        scoreEX1stHalf: [0, [Validators.required, Validators.pattern(this.patternNum), Validators.max(99)]],
        scoreEX2ndHalf: [0, [Validators.required, Validators.pattern(this.patternNum), Validators.max(99)]]
      })
    });

    // プロパティ初期化
    this.isShowModal = false;
  }

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
  public arrayNumberLength(number: number): Array<number>[] {
    return [...Array(number)];
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
   * リーグ表のセル押下時のイベント
   * @param rowIdx
   * @param colIdx
   * @param selfFlg
   */
  public onClickCell(rowIdx: number, colIdx: number, selfFlg: boolean): void {

    // チームの取得
    const team = this.teamIdList[rowIdx];
    const oppTeam = this.teamIdList[colIdx];

    // 試合情報の取得
    const game = this.gameList.find(game => {
      if(selfFlg) {
        return game.teamInfo[0].teamID == team && game.teamInfo[1].teamID == oppTeam;
      } else {
        return game.teamInfo[0].teamID == oppTeam && game.teamInfo[1].teamID == team;
      }
    });
    // 試合情報が存在しない場合、ダイアログを表示して終了
    if(!game) {
      this.commonService.openNoticeDialog(this.msg.errTitle, this.msg.getErr.replace('※1','試合情報'));
      return;
    }

    // 試合結果の取得
    const gameResult = this.gameResultList.find(gameRslt => {
      return game.gameID.toString() == gameRslt.gameID
        && gameRslt.groupID == team;
    });
    // 試合結果の取得(相手側)
    const oppGameResult = this.gameResultList.find(gameRslt => {
      return game.gameID.toString() == gameRslt.gameID
        && gameRslt.groupID != team;
    });

    // フォームに取得した値を設定する
    if(gameResult) {
      const formValue = {
        gameID: game.gameID,
        team: team,
        score1stHalf: gameResult.gameResult.score1stHalf,
        score2ndHalf: gameResult.gameResult.score2ndHalf,
        scoreEX1stHalf: gameResult.gameResult.scoreEX1stHalf,
        scoreEX2ndHalf: gameResult.gameResult.scoreEX2ndHalf
      };
      this.formGroup.get('teamForm').patchValue(formValue);
    } else {
      // 試合結果が取得出来ない場合、チーム名のみ設定し、点数は0とする
      const formValue = {
        gameID: game.gameID,
        team: team,
        score1stHalf: 0,
        score2ndHalf: 0,
        scoreEX1stHalf: 0,
        scoreEX2ndHalf: 0
      };
      this.formGroup.get('teamForm').patchValue(formValue);
    }

    // フォームに取得した値を設定する(相手チーム)
    if(oppGameResult) {
      const oppFormValue = {
        gameID: game.gameID,
        team: oppTeam,
        score1stHalf: oppGameResult.gameResult.score1stHalf,
        score2ndHalf: oppGameResult.gameResult.score2ndHalf,
        scoreEX1stHalf: oppGameResult.gameResult.scoreEX1stHalf,
        scoreEX2ndHalf: oppGameResult.gameResult.scoreEX2ndHalf
      };
      this.formGroup.get('oppTeamForm').patchValue(oppFormValue);
    } else {
      // 試合結果が取得出来ない場合、チーム名のみ設定し、点数は0とする
      const oppFormValue = {
        gameID: game.gameID,
        team: oppTeam,
        score1stHalf: 0,
        score2ndHalf: 0,
        scoreEX1stHalf: 0,
        scoreEX2ndHalf: 0
      };
      this.formGroup.get('oppTeamForm').patchValue(oppFormValue);
    }

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
  public async modGameResult(): Promise<void> {

    // フォームの情報を設定
    const form = this.formGroup.value;

    // ダイアログ表示
    const dialog = await this.commonService.openConfirmDialog(this.msg.confirmationTitle, this.msg.updateConfirmation.replace('※1','試合結果'));

    // キャンセルなら処理中断
    if(!dialog) {
      return;
    }

    try {
      // リーグ情報更新処理
      const res = await this.commonService.apiPost('game/editLeague', {
        form: form,
        compID: this.commonService.getEditInfo().id
      }).toPromise();

      // サーバーサイド処理結果判定
      if(res.result == 'ok') {
        await this.commonService.openNoticeDialog(this.msg.updateDoneTitle, this.msg.updateDone.replace('※1','試合結果'));
        // フォームの変更状態をもとに戻す
        this.formGroup.markAsPristine();
        // 画面情報の更新
        this.isShowModal = false;
        document.location.reload();
      } else {
        await this.commonService.openNoticeDialog(this.msg.errTitle, this.msg.updateErr.replace('※1','試合結果'));
      }

    } catch(e) {
      this.commonService.errorOnApi(e);
    }
  }

  /**
   * 合計点数の計算を行う
   * @param fgName
   */
  public calcScore(fgName: string): number {
    // フォームから値を取得する
    const form = this.formGroup.get(fgName).value;

    // フォームから数値のみ取り出す
    const scoreList: number[] = Object.values(form).map(v => {
      // 型がnumberの場合そのまま返却
      if(typeof v == 'number') {
        return v;
      } else if(typeof v == 'string') {
        // 型がstringであれば、パターンに一致する値は数値変換
        if(this.patternNum.test(v)) {
          return parseInt(v);
        } else {
          // その他は文字列とみなし、0で返却
          return 0;
        }
      } else {
        // その他の型は0を返却
        return 0;
      }
    });

    // 合計点数を算出し返却
    return scoreList.reduce((prev, cur) => prev + cur, 0);
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
          return gameResult.gameID == games[i].gameID.toString()
            && gameResult.groupID == teamID;
        });
        if(!gameResult) continue;
        const score = gameResult.gameResult.scoreResult;

        // 試合IDが一致するかつ、チームIDが不一致の試合結果(対戦相手のデータ)を抽出
        const oppGameResult = this.gameResultList.find(gameResult => {
          return gameResult.gameID == games[i].gameID.toString()
            && gameResult.groupID != teamID;
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
