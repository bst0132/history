type GameInfCom = {
  /** 開催日 */
  eventDate?: string;
  /** 開始時間 */
  gameStartTime?: string;
  /** 終了時間 */
  gameEndTime?: string;
  /** 開催場所 */
  gamePlaceName?: string;
  /** 開催場所-住所 */
  gamePlaceAdd?: string;
  /** 開催場所-電話番号 */
  gamePlaceTel?: string;
  /** 開催場所-天気 */
  gamePlaceWeather?: string;
  /** 開催場所-気温 */
  gamePlaceTemp?: string;
  /** 開催場所-湿度 */
  gamePlaceHumi?: string;
  /** 入場者数 */
  gameAttendance?: string;
  /** 試合形式情報 */
  gameSystemInf: {
    /** 試合形式 */
    gameSystem: string;
    /** 試合形式名 */
    gameSystemName: string;
    /** 参加チーム数 */
    gameTeamCnt: number;
    /** 前試合ID */
    preGameID?: string[];
    /** 後試合ID */
    postGameID?: string;
    /** ３位決定戦ID */
    thirdPlaceGameID?: string;
  };
  /** 試合名 */
  gameName?: string;
  /** 試合紹介 */
  gameIntro?: string;
  /** 試合情報確定フラグ */
  gameConfirmFlg: string;
}

export default GameInfCom;
