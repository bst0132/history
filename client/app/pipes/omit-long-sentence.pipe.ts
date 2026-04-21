import { Pipe, PipeTransform } from '@angular/core';


/**
 * 渡された文字列を指定の文字数で切り取り、後ろに任意の文字列を付与する
 */
@Pipe({
  name: 'omitLongSentence'
})
export class OmitLongSentencePipe implements PipeTransform {

  transform(value: string, length: number, replaceString = ''): string {
    if(value.length <= length) {
      return value;
    } else {
      return `${value.slice(0, length)}${replaceString}`;
    }
  }

}
