import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy, VerifyCallback } from 'passport-google-oauth20';
import { ConfigService } from '@nestjs/config';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User, UserDocument } from '../schemas/user.schema';

export interface GoogleProfile {
  id: string;
  emails: { value: string; verified: boolean }[];
  name: { givenName: string; familyName: string };
  photos: { value: string }[];
}

@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy, 'google') {
  constructor(
    private configService: ConfigService,
    @InjectModel(User.name) private userModel: Model<UserDocument>,
  ) {
    super({
      clientID: configService.get<string>('auth.google.clientId'),
      clientSecret: configService.get<string>('auth.google.clientSecret'),
      callbackURL: configService.get<string>('auth.google.callbackUrl'),
      scope: ['email', 'profile'],
    });
  }

  async validate(
    accessToken: string,
    refreshToken: string,
    profile: GoogleProfile,
    done: VerifyCallback,
  ): Promise<any> {
    try {
      const { id, emails, name, photos } = profile;
      const email = emails[0].value;

      // Check if user already exists
      let user = await this.userModel.findOne({
        $or: [{ email }, { providerId: id, provider: 'google' }],
      });

      if (user) {
        // Update existing user
        user.lastLoginAt = new Date();
        user.avatar = photos[0]?.value;
        await user.save();
      } else {
        // Create new user
        user = new this.userModel({
          email,
          name: `${name.givenName} ${name.familyName}`,
          provider: 'google',
          providerId: id,
          avatar: photos[0]?.value,
          lastLoginAt: new Date(),
          isActive: true,
        });
        await user.save();
      }

      done(null, user);
    } catch (error) {
      done(error, null);
    }
  }
}
