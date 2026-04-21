import { Component, OnInit } from '@angular/core';
import { CommonService } from 'client/app/common/common.service';
import { CompInfo, GameInfo } from 'defs/api';
import { PlayerHistory, User } from 'defs';

@Component({
  selector: 'app-player-result',
  templateUrl: './player-result.component.html',
  styleUrls: ['./player-result.component.scss']
})
export class PlayerResultComponent implements OnInit {

  compInfo: CompInfo[];

  gameInfo: GameInfo[];

  playerResults: Pick<PlayerHistory, 'competitionID' | 'gameID' | 'records' | 'userID'>[];

  user: Pick<User, 'nickname' | 'playerInf'>;

  constructor(private commonService: CommonService) { }

  /**
   * 初期処理
   */
  public async ngOnInit(): Promise<void> {
    // ログイン情報の取得
    const data = this.commonService.getLoginInfo();

    try {
      // 個人履歴取得処理
      const res = await this.commonService.apiPost('user/playerResult', data).toPromise();

      // 取得結果の設定
      this.compInfo = res.compInfo;
      this.gameInfo = res.gameInfo;
      this.playerResults = res.playerResults;
      this.user = res.user;

    } catch(e) {
      this.commonService.errorOnApi(e);
    }

    // TODO 将来的に競技が増えたら、競技毎にグルーピングを行う？

  }

  /**
   * ユーザーの氏名を取得する
   */
  public getFullName(): string {
    if(!this.user) {
      return '';
    }
    return `${this.user.playerInf.lastName} ${this.user.playerInf.firstName}`;
  }

  /**
   * 大会名を取得する
   * @param compId
   */
  public getCompName(compId: string): string {
    if(!compId) return '';
    return this.compInfo.find(comp => {
      return comp.compId.toString() == compId;
    }).compName;
  }

  /**
   * 開催日を取得する
   * @param gameID
   */
  public getEventDate(gameID: string): string {
    if(!gameID) return '';
    return this.gameInfo.find(game => {
      return game.gameID.toString() == gameID;
    }).gameInfCom.eventDate;
  }

  /**
   * 試合名を取得する
   * @param gameID
   */
  public getGameName(gameID: string): string {
    if(!gameID) return '';
    const result =  this.gameInfo.find(game => {
      return game.gameID.toString() == gameID;
    });
    // 試合名が設定されていない場合はNO NAMEとする
    if(!result.gameInfCom.gameName) {
      return 'NO NAME';
    } else {
      return result.gameInfCom.gameName;
    }
  }
}
