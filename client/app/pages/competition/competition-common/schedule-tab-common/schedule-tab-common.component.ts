import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CompDetailInf, GameGroups, LoginInfo } from 'defs/api';
import { CNS } from 'client/app/common/defines';
import { ObjectId } from 'mongodb';

@Component({
  selector: 'app-schedule-tab-common',
  templateUrl: './schedule-tab-common.component.html',
  styleUrls: ['./schedule-tab-common.component.scss']
})
export class ScheduleTabCommonComponent {

  // 定数使用用変数
  cns = CNS;

  // 受け取るデータ
  @Input() compInfo: CompDetailInf;
  @Input() canEdit: boolean;
  @Input() leagueList: GameGroups[];
  @Input() tournamentList: GameGroups[];
  @Input() loginInfo: LoginInfo;

  // 親コンポーネントに対してイベントを発火するためのプロパティ
  @Output() eventOnClickRegAndEditGame = new EventEmitter<{ gameSystem: string; gameId?: ObjectId }>();
  @Output() eventChangeToEdit = new EventEmitter<void>();
  @Output() eventOnClickToGameDetail = new EventEmitter<{ gameSystem: string; gameId?: ObjectId }>();

  // イベントをキャッチして親コンポーネントへのイベントを発火
  // 各メソッドの具体的な処理内容はcompetition-guide.component.tsで確認する
  public onClickRegAndEditGame(gameSystem: string, gameId?: ObjectId): void {
    this.eventOnClickRegAndEditGame.emit({ gameSystem, gameId });
  }

  public changeToEdit(): void {
    this.eventChangeToEdit.emit();
  }

  // メソッドの具体的な処理内容はreference-competition-guide.component.tsで確認する
  public onClickToGameDetail(gameSystem: string, gameId: ObjectId): void {
    // ログイン情報がある場合はonClickRegAndEditGameメソッドへイベントを伝える
    if (this.loginInfo) {
      this.eventOnClickRegAndEditGame.emit({ gameSystem, gameId });
      return;
    }
    this.eventOnClickToGameDetail.emit({ gameSystem, gameId });
  }

}
