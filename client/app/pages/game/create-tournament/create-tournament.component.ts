import { Component, OnInit } from '@angular/core';
import { UntypedFormGroup, UntypedFormBuilder, UntypedFormArray } from '@angular/forms';
import { CommonService } from '../../../common/common.service';
import { CompInfForCreGame, TeamInfo } from 'defs/api';
import { MSG } from '../../../common/message-defines';

@Component({
  selector: 'app-create-tournament',
  templateUrl: './create-tournament.component.html',
  styleUrls: ['./create-tournament.component.scss']
})
export class CreateTournamentComponent implements OnInit {

  formGroup: UntypedFormGroup;

  compInfo: CompInfForCreGame;

  teamList: TeamInfo[];

  /** 2を底とした対数関数の結果 */
  logTeamCnt: number;

  msg = MSG;

  /**
   * コンストラクタ
   * @param commonService
   * @param formBuilder
   */
  constructor(private commonService: CommonService, private formBuilder: UntypedFormBuilder) {
    this.formGroup = formBuilder.group({
      gameGroupName: [''],
      groupPartTeamCnt: [''],
      thirdPlace: [''],
      teams: this.formBuilder.array([])
    });
  }

  canDeactive(): boolean {
    return !this.formGroup.dirty;
  }

  /**
   * 初期処理
   */
  public async ngOnInit(): Promise<void> {

    // 遷移元から引き継ぎ情報を受け取る
    const editInfo = this.commonService.getEditInfo();
    if(!editInfo || editInfo.type != 'game') {
      this.commonService.navigateBack();
      return;
    }

    try {
      // サーバーサイド処理(大会情報の取得)
      const res = await this.commonService.apiPost('game/getCompInfo', editInfo).toPromise();
      // 異常なら再度一覧から検索させる
      if (res.result != 'ok') {
        this.commonService.navigateBack();
        return;
      }

      // 取得情報の設定
      this.compInfo = res.compInfo;
      this.teamList = res.teamList;

      // グループ名称、参加チーム数の設定
      this.formGroup.get('gameGroupName').setValue(editInfo.gameGroupName);
      const teamCnt = parseInt(editInfo.groupPartTeamCnt);
      this.formGroup.get('groupPartTeamCnt').setValue(teamCnt);

      // 参加チームが2の何乗かを求める(トーナメントの列数となる)
      this.logTeamCnt = Math.log2(teamCnt);

      // 参加チーム分のformControlを生成
      const formArray = this.formGroup.get('teams') as UntypedFormArray;
      for (let index = 0; index < teamCnt / 4; index++) {
        formArray.push(this.formBuilder.group({
          teamName1: [''],
          teamName2: [''],
          teamName3: [''],
          teamName4: ['']
        }));
      }
    } catch(e) {
      this.commonService.errorOnApi(e);
      this.commonService.navigateBack();
    }

  }

  /**
   * トーナメント登録処理
   */
  public async onSubmit(): Promise<void> {

    // サーバサイドに送るデータをフォームから設定
    const data = this.formGroup.value;

    // ダイアログ表示
    const dialog = await this.commonService.openConfirmDialog(this.msg.confirmationTitle, this.msg.regConfirmation.replace('※1','トーナメント'));

    // キャンセルなら処理中断
    if(!dialog) {
      return;
    }

    try {
      // トーナメント登録処理
      const res = await this.commonService.apiPost('game/createTournament',
        {
          data: data,
          compInfo: this.compInfo
        }).toPromise();

      // サーバサイド処理結果判定
      if(res.result == 'ok') {
        await this.commonService.openNoticeDialog(this.msg.regTitle, this.msg.regDone.replace('※1','トーナメント'));
        // フォームの変更状態をもとに戻す
        this.formGroup.markAsPristine();

      } else {
        await this.commonService.openNoticeDialog(this.msg.errTitle, res.message);
      }

    } catch(e) {
      this.commonService.errorOnApi(e);
    }

  }

  /**
   * 戻るボタン押下時の処理
   */
  public pageBack(): void {
    this.commonService.navigateBack();
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
   * 2のn乗を返却するメソッド
   * @param n
   */
  public getPowNum(n: number): number {
    return Math.pow(2, n);
  }

  /**
   * teamsのgetter
   */
  get teams(): UntypedFormArray {
    return this.formGroup.get('teams') as UntypedFormArray;
  }

}
