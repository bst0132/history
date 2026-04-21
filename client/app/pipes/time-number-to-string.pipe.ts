import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'timeNumberToString'
})
export class TimeNumberToStringPipe implements PipeTransform {

  /**
   * 時間の表示方法を変換する
   * @param time
   */
  transform(time: number): string {
    // timeが未定義/null/NaNの場合は空文字を返却(0の場合は後続の処理を行う)
    if(time === undefined || time === null || isNaN(time)){
      return '';
    }

    // timeの値を「時間」と「分」に分ける
    const hour = Math.floor(time / 100);
    const minute = time % 100;

    // 表示方法を「00：00」のかたちに変換した時間を返却
    const timeLabel: string = hour.toString().padStart(2, '0') + ':' + minute.toString().padStart(2, '0');
    return timeLabel;
  }

}
