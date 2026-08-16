import { EncryptionService } from '../../services/EncryptionService';

describe('EncryptionService', () => {
  const originalEncryptionKey = process.env.ENCRYPTION_KEY;
  
  beforeAll(() => {
    process.env.ENCRYPTION_KEY = 'test-encryption-key-32-chars-long';
  });

  afterAll(() => {
    process.env.ENCRYPTION_KEY = originalEncryptionKey;
  });

  describe('encrypt', () => {
    it('should encrypt text', () => {
      const text = 'sensitive data';
      const encrypted = EncryptionService.encrypt(text);
      
      expect(encrypted).toBeDefined();
      expect(encrypted).not.toBe(text);
      expect(encrypted.length).toBeGreaterThan(0);
    });

    it('should produce different encrypted values for the same text', () => {
      const text = 'sensitive data';
      const encrypted1 = EncryptionService.encrypt(text);
      const encrypted2 = EncryptionService.encrypt(text);
      
      expect(encrypted1).not.toBe(encrypted2);
    });
  });

  describe('decrypt', () => {
    it('should decrypt encrypted text', () => {
      const text = 'sensitive data';
      const encrypted = EncryptionService.encrypt(text);
      const decrypted = EncryptionService.decrypt(encrypted);
      
      expect(decrypted).toBe(text);
    });

    it('should handle special characters', () => {
      const text = 'special chars: áéíóú ñ ¿ ¡';
      const encrypted = EncryptionService.encrypt(text);
      const decrypted = EncryptionService.decrypt(encrypted);
      
      expect(decrypted).toBe(text);
    });
  });

  describe('generateHash', () => {
    it('should generate consistent hash for same input', () => {
      const data = 'test data';
      const hash1 = EncryptionService.generateHash(data);
      const hash2 = EncryptionService.generateHash(data);
      
      expect(hash1).toBe(hash2);
    });

    it('should generate different hashes for different inputs', () => {
      const data1 = 'test data 1';
      const data2 = 'test data 2';
      const hash1 = EncryptionService.generateHash(data1);
      const hash2 = EncryptionService.generateHash(data2);
      
      expect(hash1).not.toBe(hash2);
    });
  });
});
