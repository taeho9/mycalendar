import { encryptToken, decryptToken } from './crypto.util';

describe('CryptoUtil', () => {
  const secretKey = 'my-super-secret-key-for-test-32b';

  it('should encrypt and decrypt a plaintext token accurately', () => {
    const original = 'ya29.a0AfH6SMD...sample_google_token';
    const encrypted = encryptToken(original, secretKey);

    expect(encrypted).toBeDefined();
    expect(encrypted).not.toEqual(original);
    expect(encrypted.split(':')).toHaveLength(3); // iv:tag:data

    const decrypted = decryptToken(encrypted, secretKey);
    expect(decrypted).toBe(original);
  });

  it('should return empty string if input is empty', () => {
    expect(encryptToken('', secretKey)).toBe('');
    expect(decryptToken('', secretKey)).toBe('');
  });
});
