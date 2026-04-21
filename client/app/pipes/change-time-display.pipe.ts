import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'changeTimeDisplay'
})
export class ChangeTimeDisplayPipe implements PipeTransform {

  /**
   * 時刻の表示方法を変換する
   * @param hour
   * @param minute
   * @returns
   */
  transform(hour: number, minute: number | string) : string {

    // hour,minuteが両方ともnullではない場合は～時～分の形式に変換、nullの場合は空文字を返す
    return (hour !== null && minute !== null) ? `${hour} 時 ${minute} 分` : '';
  }
}
