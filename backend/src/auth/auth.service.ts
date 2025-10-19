import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import * as bcrypt from 'bcrypt';
import { User, UserDocument } from './schemas/user.schema';
import { JwtPayload } from './strategies/jwt.strategy';

export interface LoginDto {
  username: string;
  password: string;
}

export interface RegisterDto {
  email: string;
  name: string;
  password: string;
  role?: string;
}

export interface AuthResponse {
  access_token: string;
  refresh_token?: string;
  user: {
    id: string;
    email: string;
    name: string;
    role: string;
  };
}

@Injectable()
export class AuthService {
  constructor(
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    private jwtService: JwtService,
  ) {}

  async validateUser(username: string, password: string): Promise<UserDocument | null> {
    // Support both email and name as username
    const user = await this.userModel
      .findOne({
        $or: [{ email: username }, { name: username }],
        isActive: true,
      })
      .exec();

    if (user && user.password && (await bcrypt.compare(password, user.password))) {
      return user;
    }
    return null;
  }

  async login(loginDto: LoginDto): Promise<AuthResponse> {
    const user = await this.validateUser(loginDto.username, loginDto.password);

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Update last login time
    user.lastLoginAt = new Date();
    await user.save();

    const payload: JwtPayload = {
      sub: user._id.toString(),
      email: user.email,
      role: user.role,
    };

    const access_token = this.jwtService.sign(payload);

    return {
      access_token,
      user: {
        id: user._id.toString(),
        email: user.email,
        name: user.name,
        role: user.role,
      },
    };
  }

  async validateToken(token: string): Promise<UserDocument | null> {
    try {
      const payload = this.jwtService.verify(token) as JwtPayload;
      const user = await this.userModel.findById(payload.sub).exec();

      if (!user || !user.isActive) {
        return null;
      }

      return user;
    } catch (error) {
      return null;
    }
  }

  async refreshToken(refreshToken: string): Promise<AuthResponse> {
    // For now, we'll implement basic refresh logic
    // In production, you'd want separate refresh token storage
    const user = await this.validateToken(refreshToken);

    if (!user) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    const payload: JwtPayload = {
      sub: user._id.toString(),
      email: user.email,
      role: user.role,
    };

    const access_token = this.jwtService.sign(payload);

    return {
      access_token,
      user: {
        id: user._id.toString(),
        email: user.email,
        name: user.name,
        role: user.role,
      },
    };
  }

  async logout(userId: string): Promise<void> {
    // Update user's last logout time or invalidate sessions
    await this.userModel.findByIdAndUpdate(userId, {
      lastLoginAt: null, // Reset login time on logout
    });
  }

  // Utility method for creating test users during development
  async createUser(
    email: string,
    name: string,
    password: string,
    role: string = 'user',
  ): Promise<UserDocument> {
    const hashedPassword = await bcrypt.hash(password, 10);

    const user = new this.userModel({
      email,
      name,
      password: hashedPassword,
      role,
      provider: 'local',
    });

    return user.save();
  }

  // Register a new user
  async register(registerDto: RegisterDto): Promise<AuthResponse> {
    // Check if user already exists
    const existingUser = await this.userModel.findOne({
      email: registerDto.email,
    });

    if (existingUser) {
      throw new UnauthorizedException('User with this email already exists');
    }

    // Create new user
    const hashedPassword = await bcrypt.hash(registerDto.password, 10);

    const user = new this.userModel({
      email: registerDto.email,
      name: registerDto.name,
      password: hashedPassword,
      role: registerDto.role || 'user',
      provider: 'local',
      isActive: true,
    });

    const savedUser = await user.save();

    // Generate JWT token for the new user
    const payload: JwtPayload = {
      sub: savedUser._id.toString(),
      email: savedUser.email,
      role: savedUser.role,
    };

    const access_token = this.jwtService.sign(payload);

    return {
      access_token,
      user: {
        id: savedUser._id.toString(),
        email: savedUser.email,
        name: savedUser.name,
        role: savedUser.role,
      },
    };
  }

  // Method to seed default users for testing
  async seedDefaultUsers(): Promise<void> {
    const adminExists = await this.userModel.findOne({ email: 'admin@clothingstore.com' });

    if (!adminExists) {
      await this.createUser('admin@clothingstore.com', 'admin', 'password123', 'admin');
    }

    const userExists = await this.userModel.findOne({ email: 'user@clothingstore.com' });

    if (!userExists) {
      await this.createUser('user@clothingstore.com', 'user', 'password123', 'user');
    }
  }
}
