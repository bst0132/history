import { Component, Inject } from '@angular/core';
import { MAT_LEGACY_DIALOG_DATA as MAT_DIALOG_DATA, MatLegacyDialogRef as MatDialogRef } from '@angular/material/legacy-dialog';
import { ImageCroppedEvent } from 'ngx-image-cropper';

export interface DialogData {
  dataUrl: string;
}

@Component({
  selector: 'app-select-image-area-dialog',
  templateUrl: './select-image-area-dialog.component.html',
  styleUrls: ['./select-image-area-dialog.component.scss']
})
export class SelectImageAreaDialogComponent {

  // トリミング後のバイナリデータ
  croppedImage: string;

  constructor(@Inject(MAT_DIALOG_DATA) public data: DialogData,
  private dialogRef: MatDialogRef<SelectImageAreaDialogComponent>) {
    // マスク部分押下でモーダルクローズしないよう制御
    dialogRef.disableClose = true;
  }

  /**
   * トリミング処理
   * @param event マウスを離す度に行われるトリミングイベント
   */
  public imageCropped(event: ImageCroppedEvent): void {
    // トリミング後の画像データ格納
    this.croppedImage = event.base64;
  }
}
