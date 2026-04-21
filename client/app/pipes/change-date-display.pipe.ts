import { Pipe, PipeTransform } from '@angular/core';
import * as moment from 'moment';

@Pipe({
  name: 'changeDateDisplay'
})
export class ChangeDateDisplayPipe implements PipeTransform {

  /**
   * 日付の表示方法を変換する
   * @param date
   */
  transform(date: string): string {

    // 有効な日付の場合はYYYY年MM月DD日に変換し、無効な値の場合は空文字を返す
    return moment(date).isValid() ? moment(date).format('YYYY年MM月DD日') : '';

  }

}
