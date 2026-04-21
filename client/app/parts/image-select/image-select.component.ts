import { Component, Input, ViewChild, ElementRef, Output, EventEmitter } from '@angular/core';
import { MatLegacyDialog as MatDialog } from '@angular/material/legacy-dialog';
import { CommonService } from '../../common/common.service';
import ImageInf from 'defs/entity/imageInf';
import { SelectImageAreaDialogComponent } from '../../dialog/select-image-area-dialog/select-image-area-dialog.component';
import { MSG } from '../../common/message-defines';
import imageCompression from 'browser-image-compression';

@Component({
  selector: 'app-image-select',
  templateUrl: './image-select.component.html',
  styleUrls: ['./image-select.component.scss']
})
export class ImageSelectComponent {

  @Input()
  imageInfo: ImageInf;

  @Input()
  mode: 'show' | 'edit';

  // 画像の形の判定用変数
  @Input()
  shape: string;

  @Output()
  imageChange = new EventEmitter<ImageInf>();

  @ViewChild('image')
  image: ElementRef;

  fileReader = new FileReader();

  maxFileSize = 1024 * 1024;

  width: string;

  height: string;

  // 画像圧縮オプション
  options = {
    maxSizeMB: 1, // 画像の最大サイズ
  }

  msg = MSG;

  // デバイス判定用変数
  device: 'pc' | 'sp';

  constructor(private dialog: MatDialog, private commonService: CommonService) {

    // デバイス判定
    this.device = commonService.isMobile ? 'sp' : 'pc';

    // ダイアログサイズの設定値をスマホとPCで分ける
    if(this.device === 'sp') {
      this.width = '95vw';
      this.height = 'auto';
    } else {
      this.width = '600px';
      this.height = '600px';
    }

    // 読み込み後のコールバック
    this.fileReader.onload = (event: ProgressEvent<FileReader>): void => {
      this.imageInfo.dataUrl = event.target.result as string;
      // TO DO 下記の部分はtransformの項目削除時に消す。
      this.imageInfo.transform = '';

      // 変更後のdataUrlを親コンポーネントに通知
      this.dialog.open(SelectImageAreaDialogComponent, {
        data: this.imageInfo,
        maxWidth: 'none',
        width: this.width,
        height: this.height,
      }).afterClosed().subscribe(result => {
        if(result) {
          // 画像調整ダイアログの処理結果を変数に格納
          this.imageInfo.dataUrl = result;
          // 変更後のdataUrlを親コンポーネントに通知
          this.imageChange.emit(this.imageInfo);
        }
      });
    };
  }

  /**
   * ボタンクリックでブラウザのファイル選択を実行させる
   */
  public onClickFileInputButton(): void {
    this.image.nativeElement.click();
  }

  /**
   * ファイル変更後、チェックと画像圧縮を実施したのち、読み取り実行
   */
  public async onChangeImage(): Promise<void> {
    const file = this.image.nativeElement.files[0];
    if (!file) {
      return;
    }
    // 画像ファイルではない場合はエラーダイアログ表示
    if (!file.type.match('image.*')) {
      this.commonService.openNoticeDialog(this.msg.errTitle, this.msg.imageunselectErr);
      this.image.nativeElement.value = null;
      return;
    }
    // 画像圧縮処理(DBに格納するデータ量を小さくするため全圧縮)
    const compressedFile = await imageCompression(file, this.options);
    // 圧縮後サイズが1MBを超える場合はエラーダイアログ表示
    if(compressedFile.size > this.maxFileSize) {
      this.commonService.openNoticeDialog(this.msg.errTitle, this.msg.imageCapaExcessErr);
      this.image.nativeElement.value = null;
      return;
    }

    this.fileReader.readAsDataURL(compressedFile);
  }

  /**
   * 選択済の画像を削除する
   */
  public onClickDeleteImage(): void {
    this.imageInfo.dataUrl = '';
    this.imageInfo.transform = '';
    this.image.nativeElement.value = null;
    // 削除後のdataUrlを親コンポーネントに通知
    this.imageChange.emit(this.imageInfo);
  }

}
