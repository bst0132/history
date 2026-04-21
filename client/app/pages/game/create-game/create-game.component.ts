import { Component, OnInit } from '@angular/core';
import { CommonService } from '../../../common/common.service';
import { CNS, tournamentTeamCnt } from '../../../common/defines';
import { UntypedFormGroup, UntypedFormBuilder, Validators} from '@angular/forms';
import { CompInfForCreGame } from 'defs/api';
import { MSG } from '../../../common/message-defines';


@Component({
  selector: 'app-create-game',
  templateUrl: './create-game.component.html',
  styleUrls: ['./create-game.component.scss']
})
export class CreateGameComponent implements OnInit {

  formGroup: UntypedFormGroup;

  compInfo: CompInfForCreGame;

  pattern = /^[2-9]$|^[1-9][0-9]+$/;

  /** トーナメントチーム数(セレクトボックス用) */
  teamCntList = tournamentTeamCnt;

  msg = MSG;

  /**
   * コンストラクタ
   * @param commonService
   * @param formBuilder
   */
  constructor(private commonService: CommonService, private formBuilder: UntypedFormBuilder) {
    this.formGroup = this.formBuilder.group({
      gameSystemInf: ['', Validators.required],
      gameGroupName: ['', Validators.required],
      groupPartTeamCnt: ['', [Validators.required, Validators.pattern(this.pattern)]]
    });
  }

  canDeactive(): boolean {
    return !this.formGroup.dirty;
  }

  /**
   * 初期処理
   */
  public async ngOnInit(): Promise<void> {

    const editInfo = this.commonService.getEditInfo();

    try {
      const res = await this.commonService.apiPost('game/createGame', editInfo).toPromise();
      // 異常なら再度一覧から検索させる
      if (res.result != 'ok') {
        this.commonService.navigateBack();
        return;
      }

      this.compInfo = res.compInfo;

    } catch(e) {
      this.commonService.errorOnApi(e);
      this.commonService.navigateBack();
    }

  }

  /**
   * 戻るボタン押下時の処理
   */
  public returnToManageCompetition(): void {
    // 大会編集画面に遷移
    this.commonService.navigateBack();
  }

  /**
   * 試合形式に応じたページ遷移を行う処理
   */
  public async transitionNextPage(): Promise<void> {

    // フォームから値を受け取る
    const data = this.formGroup.value;

    try {
      // 入力された内容の試合が既に登録されていないかチェックを行う
      const res = await this.commonService.apiPost('game/duplicationCheck', {
        compId: this.compInfo.compId,
        gameSystemInf: data.gameSystemInf,
        gameGroupName: data.gameGroupName,
      }).toPromise();

      // サーバサイド処理結果判定
      if(res.result == 'ok') {
        // フォームの変更状態をもとに戻す
        this.formGroup.markAsPristine();

      } else {
        await this.commonService.openNoticeDialog(this.msg.errTitle, res.message);
        return;

      }

    } catch(e) {
      this.commonService.errorOnApi(e);
      return;
    }

    // 試合形式に応じてページ遷移する
    const gameSystemInf = this.formGroup.get('gameSystemInf').value;

    switch(gameSystemInf) {

      // 単独試合
      case 'singleGame':
        this.commonService.navigateWithEdit(CNS.pathToEditGame, this.commonService.getEditInfo());
        break;

      // トーナメント
      // case 'tournament':
      //   this.commonService.navigateWithEdit(CNS.pathToCreateTournament, {
      //     id: this.compInfo.compId,
      //     type: 'game',
      //     gameSystemInf: gameSystemInf,
      //     gameGroupName: data.gameGroupName,
      //     groupPartTeamCnt: data.groupPartTeamCnt
      //   });
      //   break;

      // リーグ
      case 'league':
        this.commonService.navigateWithEdit(CNS.pathToCreateLeague, {
          id: this.compInfo.compId,
          type: 'game',
          gameSystemInf: gameSystemInf,
          gameGroupName: data.gameGroupName,
          groupPartTeamCnt: data.groupPartTeamCnt
        });
        break;
    }

  }

  /**
   * keyvaluePipeのソートを無効にするための関数
   * [説明]：
   * keyvaluePipeはデフォルトで昇順にソートされるため、
   * 必ず0を返す関数を引数として渡し、ソートが行われないようにする
   */
  public returnZero(): number {
    return 0;
  }

}
