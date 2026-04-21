import { HostListener, Directive } from '@angular/core';
import { Observable } from 'rxjs';
import { CommonService } from '../common/common.service';

/**
 * 編集系画面の抽象クラス
 */
@Directive()
export abstract class EditPageBase {
  constructor(public commonService: CommonService){}

  /**
   * 編集中等判定し、遷移キャンセルする場合はfalseを返す関数を実装する
   */
  abstract canDeactive(): Observable<boolean> | boolean;

  @HostListener('window:unload', ['$event'])
  onUnload(event): void{
      this.canReload(event);
  }

  @HostListener('window:beforeunload', ['$event'])
  onBeforeUnload(event): void {
    this.canReload(event);
  }

  canReload(event: any): void {
    if(!this.canDeactive()) {
      // メッセージを指定するが、IEとEdgeのみ有効
      event.returnValue = 'ページを移動すると編集中のデータは失われます。\nよろしいですか？';
    }
  }
}
