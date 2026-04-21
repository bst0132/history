import { Pipe, PipeTransform } from '@angular/core';
import { compSystems } from '../common/defines';

@Pipe({
  name: 'getCompSystemValue'
})
export class GetCompSystemValuePipe implements PipeTransform {

  /**
   * 大会方式のラベル値を取得
   * @param key
   */
  transform(key: string): string {
    // keyが空の場合は空文字を返却
    if(!key){
      return '';
    }

    // keyの値が一致するオブジェクトをcompSystemから取得
    const system = compSystems.find(system => system.key === key);

    // keyに対応する大会方式が存在しない場合、空文字を返却
    if(!system){
      return '';
    }

    // 大会方式からラベル値を取得し返却
    return system.value;
  }

}
