import {
  Controller,
  Post,
  Body,
  HttpCode,
  HttpStatus,
  UseGuards,
  Get,
  Request,
  UnauthorizedException,
} from '@nestjs/common';
import { AuthService, LoginDto, RegisterDto, AuthResponse } from './auth.service';
import { JwtAuthGuard } from './guards/jwt-auth.guard';

export interface RefreshTokenDto {
  refresh_token: string;
}

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(@Body() loginDto: LoginDto): Promise<AuthResponse> {
    return this.authService.login(loginDto);
  }

  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  async register(@Body() registerDto: RegisterDto): Promise<AuthResponse> {
    return this.authService.register(registerDto);
  }

  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  async refresh(@Body() refreshTokenDto: RefreshTokenDto): Promise<AuthResponse> {
    return this.authService.refreshToken(refreshTokenDto.refresh_token);
  }

  @Post('logout')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  async logout(@Request() req: any): Promise<{ message: string }> {
    await this.authService.logout(req.user.id);
    return { message: 'Logged out successfully' };
  }

  @Get('validate')
  @UseGuards(JwtAuthGuard)
  async validate(@Request() req: any): Promise<{
    valid: boolean;
    user: {
      id: string;
      email: string;
      name: string;
      role: string;
    };
  }> {
    return {
      valid: true,
      user: {
        id: req.user._id.toString(),
        email: req.user.email,
        name: req.user.name,
        role: req.user.role,
      },
    };
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  async getProfile(@Request() req: any): Promise<{
    id: string;
    email: string;
    name: string;
    role: string;
    lastLoginAt?: Date;
  }> {
    return {
      id: req.user._id.toString(),
      email: req.user.email,
      name: req.user.name,
      role: req.user.role,
      lastLoginAt: req.user.lastLoginAt,
    };
  }

  // Development endpoint to seed users
  @Post('seed')
  @HttpCode(HttpStatus.OK)
  async seedUsers(): Promise<{ message: string }> {
    await this.authService.seedDefaultUsers();
    return { message: 'Default users seeded successfully' };
  }
}
