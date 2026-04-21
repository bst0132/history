import { Component, OnInit } from '@angular/core';
import { CommonService } from '../../../common/common.service';
import { CompDetailInf, GameGroups } from 'defs/api';
import { MSG } from '../../../common/message-defines';
import { CNS } from 'client/app/common/defines';
import { ObjectId } from 'mongodb';
import { ActivatedRoute, Params, Router } from '@angular/router';

@Component({
  selector: 'app-reference-competition-guide',
  templateUrl: './reference-competition-guide.component.html',
  styleUrls: ['./reference-competition-guide.component.scss']
})
export class ReferenceCompetitionGuideComponent implements OnInit {

  // 編集権限フラグ
  canEdit = false;

  // 大会要綱タブ表示情報
  compInfo: CompDetailInf;

  // リーグ表示情報
  leagueList: GameGroups[];

  // トーナメント表示情報
  tournamentList: GameGroups[];

  // 固定のメッセージ
  msg = MSG;

  // 定数使用用変数
  cns = CNS;

  // タブの配列番号用
  selectedTab = 0;

  // 共通コンポーネントに渡す参加チーム情報格納用
  teamInfo;

  // 暗号化大会ID
  encryptedCompId: string;

  // 暗号化有効期限
  encryptedDate: string;

  // 暗号化ゲームID
  encryptedGameId: string;

  // 勝ち点情報格納用
  winningPointInf: {
    winPoint?: number;
    drawPoint?: number;
    losePoint?: number;
  };

  /**
   * コンストラクタ
   */
  constructor(public commonService: CommonService, private route: ActivatedRoute, public router: Router) {
    // 現時点で特別な処理なし
  }

  /**
   * 初期処理
   */
  public async ngOnInit(): Promise<void> {

    // paramsはオブジェクトで各パラメータが格納されている
    this.route.queryParams.subscribe((params: Params) => {
      // paramsから暗号化大会IDと暗号化有効期限を取得
      this.encryptedCompId = params.params1;
      this.encryptedDate = params.params2;
      // トーナメント・リーグ画面から遷移してきた際にスケジュールタブから表示
      switch(params.tab) {
        case 'schedule':
          this.selectedTab = 2;
          break;

        default:
          break;
      }
    });

    try {
      // 当画面全体の取得処理
      const res = await this.commonService.apiPost('competitionInf/getCompDetailForGuest', {encryptedId: this.encryptedCompId, encryptedDate: this.encryptedDate}).toPromise();
      // 異常があればログイン画面に戻る
      if (res.result != 'ok') {
        if (res?.message) {
          await this.commonService.openNoticeDialog(this.msg.errTitle, this.msg.getErr.replace('※1', CNS.targetTypeComp + CNS.targetTypeInformation) + '\n' + res.message);
        } else {
          await this.commonService.errorOnApp();
        }
        this.commonService.navigateToLoginFromRef();
        return;
      }

      // 大会要綱タブ関連の取得情報を設定
      this.compInfo = res.compBaseInf;

      this.winningPointInf = res.compBaseInf.compSystemInf.winningPointInf;

      // リーグ／トーナメントで分けて取得情報を設定(該当なしの場合は空配列が返る)
      this.leagueList = res.gameGroups.filter(data =>
        data.gameSystem === CNS.league
      );
      this.tournamentList = res.gameGroups.filter(data =>
        data.gameSystem === CNS.tournament
      );

      // 取得したデータをフォーム・変数に設定する
      this.teamInfo = {
        regTeamList: res.regTeamList,
        inputTeamList: res.inputTeamList,
        teamIdList: res.teamIdList
      };

    } catch (e) {
      await this.commonService.errorOnService(CNS.targetTypeComp + CNS.targetTypeInformation, CNS.actionTypeGet);
      this.commonService.navigateToLoginFromRef();
      return;
    }
  }

  /**
   * リーグ／トーナメント画面へ遷移
   * @param gameSystem
   * @param gameId
   */
  public async onClickToGameDetail(data: { gameSystem: string; gameId: ObjectId }): Promise<void> {
    // ゲームIDを暗号化
    try {
      const res = await this.commonService.apiPost('gameInf/encryptionGameId', {gameId: data.gameId.toString()}).toPromise();
      // 異常があればエラーダイアログ表示
      if (res.result != 'ok') {
        await this.commonService.errorOnApp();
        return;
      }
      // 暗号化されたゲームIDの取得情報を設定
      this.encryptedGameId = res.encryptedGameId;

    } catch (e) {
      await this.commonService.errorOnService(CNS.targetTypeGame + CNS.targetTypeInformation, CNS.actionTypeGet);
      return;
    }

    // 遷移時にルーターに対して渡すパラメータを追加
    const queryParams: {
      param1: string;
      param2: string;
      param3: string;
      param4?: number;
      param5?: number;
      param6?: number;
    } = {
      param1: this.encryptedCompId,
      param2: this.encryptedDate,
      param3: this.encryptedGameId
    };

    // リーグかトーナメントかで遷移先のパスを決定
    let path = '';
    if (data.gameSystem === CNS.tournament) {
      path = CNS.pathToReferenceTournament;
    } else if (data.gameSystem === CNS.league) {
      path = CNS.pathToReferenceCompetitionLeague;
      // 遷移時にルーターに対して渡すパラメータを追加
      queryParams.param4 = this.winningPointInf.winPoint;
      queryParams.param5 = this.winningPointInf.drawPoint;
      queryParams.param6 = this.winningPointInf.losePoint;
    }

    // リーグ又はトーナメント画面にクエリパラメータ付で遷移
    this.commonService.navigateForRef(path, queryParams);
  }

}
