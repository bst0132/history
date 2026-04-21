import { Component, Inject, OnInit } from '@angular/core';
import { MAT_LEGACY_DIALOG_DATA as MAT_DIALOG_DATA, MatLegacyDialogRef as MatDialogRef } from '@angular/material/legacy-dialog';
import { CommonService } from 'client/app/common/common.service';
import { MSG } from 'client/app/common/message-defines';
import { UntypedFormGroup, UntypedFormBuilder, Validators } from '@angular/forms';
import { ObjectId } from 'mongodb';
import * as moment from 'moment';
import { HttpParams } from '@angular/common/http';
import { SafeUrl } from '@angular/platform-browser';
import { CNS } from 'client/app/common/defines';

export interface DialogData {
  compName: string;
  compId: ObjectId;
  qrcodeParts: {
    encryptedCompId: string;
    encryptedDate: string;
    expirationDate: string;
  };
}

@Component({
  selector: 'app-create-qrcode-dialog',
  templateUrl: './create-qrcode-dialog.component.html',
  styleUrls: ['./create-qrcode-dialog.component.scss']
})
export class CreateQrcodeDialogComponent implements OnInit {

  msg = MSG;

  // フォームグループ
  formGroup: UntypedFormGroup;

  // 有効期限の範囲設定用(new Date()で今日を設定)
  minDate: Date = new Date();
  maxDate: Date = new Date();

  // QRコード発行可能判定(true:発行可、false:発行不可)
  createPossible = true;

  // URLコピー完了判定
  copied = false;

  // 元となるURL
  baseUrl: string;

  // 表示する参照用URL
  url: string;

  // 暗号化大会ID
  encryptedCompId: string;

  // 暗号化有効期限
  encryptedDate: string;

  // QRコードダウンロードリンク
  qrcodeDownloadLink: SafeUrl;

  // QRコード有効期限切れフラグ
  expiredFlg: boolean = false;

  // QRコード有効期限切れの日付
  expiredDate: string;

  constructor(@Inject(MAT_DIALOG_DATA) public data: DialogData, public matDialogRef: MatDialogRef<CreateQrcodeDialogComponent>, public commonService: CommonService, private formBuilder: UntypedFormBuilder) {
    // マスク部分押下でのクローズを制御
    matDialogRef.disableClose = true;

    // 選択最大日を3カ月後に設定
    this.maxDate.setMonth(this.maxDate.getMonth() + 3);
    // フォームを作成
    this.formGroup = this.formBuilder.group({
      expirationDate: [this.maxDate, [Validators.required]]
    });
  }

  /**
   * 初期処理
   */
  public async ngOnInit(): Promise<void> {

    // 元URLの設定
    try {
      const res = await this.commonService.apiPost('competitionInf/createBaseUrlForQrcode', {}).toPromise();
      // 異常があればエラーダイアログ表示
      if (res.result != 'ok') {
        await this.commonService.errorOnApp();
        this.matDialogRef.close();
        return;
      }

      this.baseUrl = res.baseUrl;
    } catch (e) {
      await this.commonService.errorOnService(CNS.targetTypeQr + CNS.actionTypeIssue, CNS.actionTypePrepare);
      this.matDialogRef.close();
      return;
    }

    // QRコードを発行済かパーツ有無で判断、未発行なら後続の処理はしない
    if (!this.data.qrcodeParts) {
      return;
    }

    // 発行済みQRコードの有効期限が切れている場合、有効期限に関する情報を設定して処理終了
    if (this.data.qrcodeParts.expirationDate < moment(this.minDate).format('YYYY-MM-DD')) {
      // 有効期限切れフラグ立てる
      this.expiredFlg = true;
      // 有効期限切れの日付を設定（yyyy/MM/ddの形式）
      this.expiredDate = this.data.qrcodeParts.expirationDate.replace(/-/g, '/');

      return;
    }

    // QRコード作成
    this.createQrcode(this.data.qrcodeParts.encryptedCompId, this.data.qrcodeParts.encryptedDate);
    // フォームに値を設定(mat-datepickerには'YYYY-MM-DD'の形を設定)
    this.formGroup.patchValue({
      expirationDate: this.data.qrcodeParts.expirationDate
    });
  }

  /**
   * ダイアログを閉じる
   */
  public closeDialog(): void {
    // レスポンス用データ
    const responseData = {
      qrcodeParts: this.data.qrcodeParts
    };
    this.matDialogRef.close(responseData);
  }

  /**
   * 有効期限の値が変更された時の処理
   */
  public onDateChange(): void {
    // 発行済の場合、初期値と同じ日付を選択された時は発行不可にする
    if (moment(this.formGroup.get('expirationDate').value).format('YYYY-MM-DD') == this.data.qrcodeParts.expirationDate) {
      this.createPossible = false;
      return;
    }
    // QRコード発行可に変更
    this.createPossible = true;
  }

  /**
   * QRコード発行・再発行ボタン押下時の処理
   */
  public async onClickCreateQrcode(): Promise<void> {
    // 暗号化APIに渡すデータ
    const encryptionData = {
      compId: this.data.compId.toString(),
      expirationDate: moment(this.formGroup.get('expirationDate').value).format('YYYYMMDD')
    };

    // 大会IDと有効期限を暗号化
    try {
      const res = await this.commonService.apiPost('competitionInf/encryptionForQrcode', encryptionData).toPromise();
      // 異常があればエラーダイアログ表示
      if (res.result != 'ok') {
        await this.commonService.errorOnApp();
        return;
      }
      // 暗号化された大会IDと有効期限の取得情報を設定
      this.encryptedCompId = res.encryptedId;
      this.encryptedDate = res.encryptedDate;

    } catch (e) {
      await this.commonService.errorOnService(CNS.targetTypeQr, CNS.actionTypeIssue);
      return;
    }

    // 登録APIに渡すデータを整形
    const qrcodePartsData = {
      compId: this.data.compId.toString(),
      qrcodeParts: {
        encryptedCompId: this.encryptedCompId,
        encryptedDate: this.encryptedDate,
        expirationDate: moment(this.formGroup.get('expirationDate').value).format('YYYY-MM-DD')
      }
    };

    // 有効期限・暗号化大会ID・暗号化有効期限を保持のためDBに登録
    try {
      const res = await this.commonService.apiPost('competitionInf/regModQrcodeParts', qrcodePartsData).toPromise();
      // 異常があればエラーダイアログ表示
      if (res.result != 'ok') {
        await this.commonService.errorOnApp();
        return;
      }
    } catch (e) {
      await this.commonService.errorOnService(CNS.targetTypeQr, CNS.actionTypeIssue);
      return;
    }

    // QRコードを作成
    this.createQrcode(this.encryptedCompId, this.encryptedDate);

    // ダイアログデータに新しい値を設定
    this.data.qrcodeParts = qrcodePartsData.qrcodeParts;
  }

  /**
   * QRコード作成
   */
  public createQrcode(compId: string, date: string): void {
    // クエリパラメータを作成
    const queryParameters: HttpParams  = new HttpParams()
      .set('params1', compId)
      .set('params2', date);
    // URLを作成
    this.url = `${this.baseUrl}?${queryParameters.toString()}`;
    // QRコード発行不可に変更
    this.createPossible = false;

    // QRコード有効期限切れフラグfalseに設定
    this.expiredFlg = false;
  }

  /**
   * コピー完了メッセージ表示
   */
  public copyMsgDisplay(): void {
    // URLコピー完了にする
    this.copied = true;
    // 2秒後にメッセージを非表示にする
    setTimeout(() => {
      this.copied = false;
    }, 2000);
  }

  /**
   * ダウンロードリンクを設定(QRコードが生成される度に行われる)
   * @param imageDataUrl QRコードの画像データURL
   */
  public onChangeUrl(imageDataUrl: SafeUrl): void {
    // 画像データURLをダウンロードリンクに設定
    this.qrcodeDownloadLink = imageDataUrl;
  }

  /**
   * Enterキー・スペースキー押下時にクリックイベント発火
   */
  public onKeyCheck(value: KeyboardEvent): void {
    this.commonService.onKeyCheck(value);
  }
}
