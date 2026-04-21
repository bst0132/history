/**
 * アルファベット大文字・小文字と半角数字からランダムな文字列を生成
 * @param len 文字数
 */
export const generateRandStr = (len = 5): string => {
  let str = '';
  const charset = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  for (let i = 0; i < len; i++) {
    str += charset[Math.floor(Math.random() * charset.length)];
  }
  return str;
};
