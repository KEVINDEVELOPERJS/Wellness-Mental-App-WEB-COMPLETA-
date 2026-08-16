import jwt from 'jsonwebtoken';
import redis from '../config/redis';

export interface TokenPayload {
  userId: number;
  email: string;
  rol: string;
}

export class JwtService {
  private static readonly ACCESS_TOKEN_EXPIRES = process.env.JWT_EXPIRES_IN || '24h';
  private static readonly REFRESH_TOKEN_EXPIRES = process.env.REFRESH_TOKEN_EXPIRES_IN || '7d';
  private static readonly ACCESS_SECRET = process.env.JWT_SECRET || 'your-access-secret';
  private static readonly REFRESH_SECRET = process.env.REFRESH_TOKEN_SECRET || 'your-refresh-secret';

  static generateAccessToken(payload: TokenPayload): string {
    return jwt.sign(payload, this.ACCESS_SECRET, {
      expiresIn: this.ACCESS_TOKEN_EXPIRES,
    });
  }

  static generateRefreshToken(payload: TokenPayload): string {
    return jwt.sign(payload, this.REFRESH_SECRET, {
      expiresIn: this.REFRESH_TOKEN_EXPIRES,
    });
  }

  static verifyAccessToken(token: string): TokenPayload {
    return jwt.verify(token, this.ACCESS_SECRET) as TokenPayload;
  }

  static verifyRefreshToken(token: string): TokenPayload {
    return jwt.verify(token, this.REFRESH_SECRET) as TokenPayload;
  }

  static async invalidateToken(token: string): Promise<void> {
    const decoded = jwt.decode(token) as { exp: number };
    const ttl = decoded.exp - Math.floor(Date.now() / 1000);
    if (ttl > 0) {
      await redis.setex(`blacklist:${token}`, ttl, '1');
    }
  }

  static async isTokenBlacklisted(token: string): Promise<boolean> {
    const result = await redis.get(`blacklist:${token}`);
    return result === '1';
  }

  static generateTokenPayload(user: { id: number; email: string; rol: string }): TokenPayload {
    return {
      userId: user.id,
      email: user.email,
      rol: user.rol,
    };
  }
}
