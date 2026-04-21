import { Component, Input } from '@angular/core';
import ImageInf from 'defs/entity/imageInf';

@Component({
  selector: 'app-game-panel',
  templateUrl: './game-panel.component.html',
  styleUrls: ['./game-panel.component.scss']
})
export class GamePanelComponent {

  // 受け取るデータ
  @Input()
  gamesInf: {
    gamePlace?: string;
    gameStartTime?: number;
    criteriaName?: string;
    criteriaLogo?: ImageInf;
    criteriaScore?: number;
    opponentName?: string;
    opponentLogo?: ImageInf;
    opponentScore?: number;
  };

  constructor() {
    // 現時点で特別な処理なし
  }

}
