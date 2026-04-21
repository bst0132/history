import { Injectable } from '@angular/core';
import { ActivatedRouteSnapshot, RouterStateSnapshot, UrlTree } from '@angular/router';
import { CommonService } from './common.service';
import { Observable } from 'rxjs';
import { EditPageBase } from '../pages/EditPageBase';
import { MSG } from '../common/message-defines';

/**
 * ページ離脱時の制御
 */
@Injectable({
  providedIn: 'root'
})
export class CanDeactiveGuard  {

  msg = MSG;

  constructor(private commonService: CommonService) {}
  async canDeactivate(
    component: EditPageBase,
    currentRoute: ActivatedRouteSnapshot,
    currentState: RouterStateSnapshot,
    nextState?: RouterStateSnapshot): Promise<boolean | UrlTree> {

    // 処理の進捗状態取得
    const progress = this.commonService.getProgress();

    // ログアウト処理/試合情報削除処理の場合は確認ダイアログをスキップして画面遷移
    if (progress === 'logout' || progress === 'deleteGame') {
      return true;
    }
    // 編集用ページのコンポーネントに実装する関数の状態を見て遷移の可否判定
    if ( component.canDeactive && !component.canDeactive()) {
      const res =  await this.commonService.openConfirmDialog(this.msg.confirmationTitle, this.msg.pageMoveConfirmation);
      // キャンセルなら履歴を元に戻す
      if (!res) {
        this.commonService.history = this.commonService.historyBackup;
      }
      return res;
    } else {
      return true;
    }
  }

}
