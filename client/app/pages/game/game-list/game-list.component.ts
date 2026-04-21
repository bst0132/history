import { Component } from '@angular/core';
import { sports, CNS } from '../../../common/defines';
import { CommonService } from 'client/app/common/common.service';
import { UntypedFormBuilder, UntypedFormGroup, Validators, ValidatorFn } from '@angular/forms';
import { GameList } from 'defs/api';
import { ObjectId } from 'mongodb';
import { MSG } from '../../../common/message-defines';

@Component({
  selector: 'app-game-list',
  templateUrl: './game-list.component.html',
  styleUrls: ['./game-list.component.scss']
})

export class GameListComponent{

  // 変数
  public sportsList = sports;           // 競技リスト
  public formGroup: UntypedFormGroup;          // 検索条件
  public gameList: GameList[] = [];     // 試合一覧表示用のリスト

  msg = MSG;

  gameDateValidator = (group: UntypedFormGroup): ValidatorFn => {

    let result = null;

    // 試合開催日の(to)が入力されていて、(from)が未入力か判定
    if(!(group.get('gameDateFrom').value) && group.get('gameDateTo').value) {
      // 試合開催日の(to)が入力されていて、(from)が未入力の場合、エラー
      result = {
        'gameDateTo-only': true
      };
    }

    // 試合開催日(from)、(to)が未入力の場合は判定しない
    if(!group.get('gameDateFrom').value || !group.get('gameDateTo').value) {
      return result;
    // 試合開催日の(to)が(from)より過去か判定
    } else if(group.get('gameDateFrom').value > group.get('gameDateTo').value) {
      // 試合開催日の(to)が(from)より過去の場合、エラー
      result = {
        'gameDateTo-past': true
      };
    }
    return result;
  }

  /**
   * コンストラクタ
   */
  constructor(private commonService: CommonService, private formBuilder: UntypedFormBuilder) {
    this.formGroup = formBuilder.group({
      compName: ['',  Validators.required],
      teamName: [''],
      sports: [sports[0].key, Validators.required],
      gameDateFrom: [''],
      gameDateTo: ['']
    },{
      validator: this.gameDateValidator
    });
  }

  /**
   * 検索処理
   */
  public async onClickSearch(): Promise<void>{

    // 条件を取得
    const data = this.formGroup.value;

    try {
      // 検索処理
      const res = await this.commonService.apiPost('game/gameList', data).toPromise();

      // サーバ処理エラー判定
      if(res.result == 'ok') {

        // 検索結果を受け取る
        this.gameList = res.gameList;
      } else {
        // エラーメッセージの表示
        await this.commonService.openNoticeDialog(this.msg.errTitle, this.msg.searchErr);
      }

    } catch(e) {
      this.commonService.errorOnApi(e);
    }
  }

  onClickGameDetail(gameList: GameList): void {

    // 試合参照画面へ遷移
    this.commonService.navigateWithEdit(CNS.pathToGameDetail, {
      id: gameList.gameID,
      type: CNS.infoTypeGame
    });
  }

}
