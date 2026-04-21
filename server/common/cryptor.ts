import * as crypto from 'crypto';

const ENCRYPTION_KEY = 'HH95XH7sYAbznRBJSUE9W8RQxzQIGSpy';
const BUFFER_KEY = 'RfHBdAR5RJHqp5wm';
const ENCRYPT_METHOD = 'aes-256-cbc';
const ENCODING = 'hex' ;
// 暗号化処理
export const getEncryptedString = (raw: string): string => {
  const iv = Buffer.from(BUFFER_KEY);
  const cipher = crypto.createCipheriv(ENCRYPT_METHOD, Buffer.from(ENCRYPTION_KEY), iv);
  let encrypted = cipher.update(raw);

  encrypted = Buffer.concat([encrypted, cipher.final()]);

  return encrypted.toString(ENCODING);
};
// 復号化処理
export const getDecryptedString = (encrypted: string): string => {
  const iv = Buffer.from(BUFFER_KEY);
  const encryptedText = Buffer.from(encrypted, ENCODING);
  const decipher = crypto.createDecipheriv(ENCRYPT_METHOD, Buffer.from(ENCRYPTION_KEY), iv);
  let decrypted = decipher.update(encryptedText);

  decrypted = Buffer.concat([decrypted, decipher.final()]);

  return decrypted.toString();
};
