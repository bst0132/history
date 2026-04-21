import { Pipe, PipeTransform } from '@angular/core';
import { sports } from '../common/defines';

@Pipe({
  name: 'getSportValue'
})
export class GetSportValuePipe implements PipeTransform {

  /**
   * スポーツのラベル値を取得する
   * @param key
   */
  transform(key: string): string {
    // key値がnull/空文字/undefinedなどの場合は処理しない。空文字を返却
    if(!key){
      return '';
    }

    // objectを取得
    const sport = sports.find(s => s.key === key);

    // keyに対応するスポーツデータが存在しない場合、空文字を返却する
    if(!sport){
      return '';
    }

    // スポーツデータからラベル値を取得し返却
    return sport.value;
  }

}
