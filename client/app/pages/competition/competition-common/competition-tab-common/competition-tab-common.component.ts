import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CompDetailInf } from 'defs/api';
import { CNS } from 'client/app/common/defines';
import { CreateQrcodeDialogComponent } from '../../../../dialog/create-qrcode-dialog/create-qrcode-dialog.component';
import { MatLegacyDialog as MatDialog } from '@angular/material/legacy-dialog';
import { CommonService } from 'client/app/common/common.service';

@Component({
  selector: 'app-competition-tab-common',
  templateUrl: './competition-tab-common.component.html',
  styleUrls: ['./competition-tab-common.component.scss']
})
export class CompetitionTabCommonComponent {

  // 定数使用用変数
  cns = CNS;

  // 受け取るデータ
  @Input() editInfo;
  @Input() canEdit: boolean;
  @Input() compInfo: CompDetailInf;

  // 親コンポーネントに対してイベントを発火するためのプロパティ
  @Output() eventChangeToEdit = new EventEmitter<void>();

  constructor(private dialog: MatDialog, public commonService: CommonService) {
    // 特別な処理はなし
  }

  // イベントをキャッチして親コンポーネントへのイベントを発火
  // メソッドの具体的な処理内容はcompetition-guide.component.tsで確認する
  public changeToEdit(): void {
    this.eventChangeToEdit.emit();
  }

  /**
   *  QRコード発行ダイアログを開く処理
   */
  public async onClickQrcodeDialogOpen(): Promise<void> {
    // ダイアログ画面で必要なデータを渡す
    const res = this.dialog.open(CreateQrcodeDialogComponent, {
      data: {
        compName: this.compInfo.compName,
        compId: this.editInfo.id,
        qrcodeParts: this.compInfo.qrcodeParts
      }
    });

    // ダイアログが閉じられたら大会要綱タブ情報の一部にデータを追加又は値を更新
    res.afterClosed().subscribe((response) => {
      if (response) {
        this.compInfo['qrcodeParts'] = response.qrcodeParts;
      }
    });
  }

  /**
   * Enterキー・スペースキー押下時にクリックイベント発火
   */
  public onKeyCheck(value: KeyboardEvent): void {
    this.commonService.onKeyCheck(value);
  }
}
