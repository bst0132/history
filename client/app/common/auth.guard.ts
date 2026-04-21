import { Injectable } from '@angular/core';
import { ActivatedRouteSnapshot, RouterStateSnapshot, UrlTree, Router } from '@angular/router';
import { Observable } from 'rxjs';
import { CommonService } from './common.service';
import { CNS } from './defines';

@Injectable({
  providedIn: 'root'
})
export class AuthGuard  {

  // 必要なモジュール取り込み
  constructor(private commonService: CommonService, private router: Router) {
  }
  /**
   * 遷移許可判定
   * @param next 遷移時のクエリパラメータとか拾えるらしい
   * @param state 遷移先のコンポーネントをツリー状にとれるらしい
   */
  canActivate(
    next: ActivatedRouteSnapshot,
    state: RouterStateSnapshot): boolean {
    // ログイン時
    if(!this.commonService.getLoginInfo()) {
      // 未ログインならログイン画面に遷移させる
      this.commonService.navigateWithoutEdit(CNS.pathToLogin);
      return false;
    }
    return true;
  }

}
