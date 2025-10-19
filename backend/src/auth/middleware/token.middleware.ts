import { Injectable, NestMiddleware, UnauthorizedException } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { JwtService } from '@nestjs/jwt';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User, UserDocument } from '../schemas/user.schema';
import { JwtPayload } from '../strategies/jwt.strategy';

// Extend Request interface to include user
interface AuthenticatedRequest extends Request {
  user?: UserDocument;
}

@Injectable()
export class TokenValidationMiddleware implements NestMiddleware {
  constructor(
    private jwtService: JwtService,
    @InjectModel(User.name) private userModel: Model<UserDocument>,
  ) {}

  async use(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      // Extract token from Authorization header
      const authHeader = req.headers.authorization;

      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        throw new UnauthorizedException('No valid authorization token provided');
      }

      const token = authHeader.substring(7); // Remove 'Bearer ' prefix

      // Verify and decode the token
      const payload = this.jwtService.verify(token) as JwtPayload;

      // Check if user exists and is active
      const user = await this.userModel.findById(payload.sub).exec();

      if (!user || !user.isActive) {
        throw new UnauthorizedException('User not found or inactive');
      }

      // Attach user to request object
      req.user = user;

      // Continue to next middleware/handler
      next();
    } catch (error) {
      if (error.name === 'TokenExpiredError') {
        throw new UnauthorizedException('Token has expired');
      }

      if (error.name === 'JsonWebTokenError') {
        throw new UnauthorizedException('Invalid token');
      }

      if (error instanceof UnauthorizedException) {
        throw error;
      }

      throw new UnauthorizedException('Token validation failed');
    }
  }
}

// Optional: Create a functional middleware for simpler use cases
export function createTokenValidationMiddleware(
  jwtService: JwtService,
  userModel: Model<UserDocument>,
) {
  return async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    const middleware = new TokenValidationMiddleware(jwtService, userModel);
    await middleware.use(req, res, next);
  };
}
