import DocumentBase from "./documentBase";

interface PlaceHistory extends DocumentBase {
  /** 主催団体情報 */
  organizerInf: {
        /** 主催団体区分 */
        organizerFlg: string;
        /** 主催団体ID */
        organizerID: string;
      };
      /** 名称 */
      placeName: string;
      /** 住所 */
      placeAdd?: string;
      /** 電話番号 */
      placeTel?: string;
}

export default PlaceHistory;
