import crypto from 'crypto';

const algorithm = 'aes-256-cbc';
// Ensure the key is 32 bytes (256 bits) for AES-256-CBC
const secretKey = crypto.scryptSync(
  process.env.ENCRYPTION_KEY || 'default-secret-key',
  'salt',
  32,
);

export const encrypt = (text: string) => {
  const iv = crypto.randomBytes(16); // Initialization vector
  const cipher = crypto.createCipheriv(algorithm, secretKey, iv);
  let encrypted = cipher.update(text);
  encrypted = Buffer.concat([encrypted, cipher.final()]);
  return iv.toString('hex') + ':' + encrypted.toString('hex');
};

export const decrypt = (text: string) => {
  const textParts = text.split(':');
  const iv = Buffer.from(textParts.shift() || '', 'hex');
  const encryptedText = Buffer.from(textParts.join(':'), 'hex');
  const decipher = crypto.createDecipheriv(
    algorithm,
    Buffer.from(secretKey),
    iv,
  );
  let decrypted = decipher.update(encryptedText);
  decrypted = Buffer.concat([decrypted, decipher.final()]);
  return decrypted.toString();
};
