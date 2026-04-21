import { Component, Input } from '@angular/core';

/**
 * 参照のみの部品
 */
@Component({
  selector: 'app-label',
  templateUrl: './label.component.html',
  styleUrls: ['./label.component.scss']
})
export class LabelComponent {

  @Input()
  value: string;

}
