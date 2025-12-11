import {
  Injectable,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { TokenBlacklistService } from 'src/services/token-blacklist.service';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  constructor(private tokenBlacklistService: TokenBlacklistService) {
    super();
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    // First, call the parent canActivate to validate JWT
    const isValid = await super.canActivate(context);

    if (!isValid) {
      return false;
    }

    // Get request and extract token
    const request = context.switchToHttp().getRequest();
    const token = this.extractTokenFromHeader(request);

    if (!token) {
      throw new UnauthorizedException('Token not found');
    }

    // Check if token is blacklisted
    const isBlacklisted =
      await this.tokenBlacklistService.isTokenBlacklisted(token);

    if (isBlacklisted) {
      throw new UnauthorizedException('Token has been revoked');
    }

    // Check if user's tokens are blacklisted (e.g., after password change)
    const user = request.user;
    if (user && user.iat) {
      const areUserTokensBlacklisted =
        await this.tokenBlacklistService.areUserTokensBlacklisted(
          user.sub,
          user.iat,
        );

      if (areUserTokensBlacklisted) {
        throw new UnauthorizedException(
          'Session expired due to security reasons. Please login again.',
        );
      }
    }

    return true;
  }

  private extractTokenFromHeader(request: any): string | null {
    const authHeader = request.headers.authorization;
    if (!authHeader) {
      return null;
    }

    const [type, token] = authHeader.split(' ');
    return type === 'Bearer' ? token : null;
  }
}
