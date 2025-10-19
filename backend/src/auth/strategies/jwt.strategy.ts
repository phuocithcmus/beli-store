import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User, UserDocument } from '../schemas/user.schema';

export interface JwtPayload {
  sub: string; // User ID
  email: string;
  role: string;
  iat?: number;
  exp?: number;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private configService: ConfigService,
    @InjectModel(User.name) private userModel: Model<UserDocument>,
  ) {
    // Try multiple ways to get the JWT secret
    let jwtSecret: string | undefined;

    try {
      jwtSecret = configService.get<string>('auth.jwt.secret');
    } catch (error) {
      console.warn('Failed to get JWT secret from config service:', error.message);
    }

    if (!jwtSecret) {
      jwtSecret =
        configService.get<string>('JWT_SECRET') ||
        process.env.JWT_SECRET ||
        'dev-secret-key-change-in-production';
    }

    if (!jwtSecret) {
      throw new Error(
        'JWT secret is required but not configured. Please set JWT_SECRET environment variable.',
      );
    }

    console.log(
      'JWT Strategy initialized with secret source:',
      jwtSecret === process.env.JWT_SECRET ? 'ENV' : 'CONFIG',
    );

    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: jwtSecret,
    });
  }

  async validate(payload: JwtPayload): Promise<UserDocument> {
    const user = await this.userModel.findById(payload.sub).exec();

    if (!user || !user.isActive) {
      throw new UnauthorizedException('User not found or inactive');
    }

    return user;
  }
}
