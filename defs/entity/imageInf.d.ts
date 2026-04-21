// TO DO…画像縮小改修によりtransformを使用しなくなったため、定義体の削除を行う

interface ImageInf {
  /** 画像をバイナリ化した文字列 */
  dataUrl: string;

  /** 画像の表示位置 */
  transform: string;
}

export default ImageInf;
