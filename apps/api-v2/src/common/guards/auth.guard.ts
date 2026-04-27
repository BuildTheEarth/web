import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { JwtService } from "@nestjs/jwt";
import { Request } from "express";
import { IS_PUBLIC_KEY } from "../decorators/skip-auth.decorator";
import { IS_AUTH_OPTIONAL_KEY } from "../decorators/optional-auth.decorator";
@Injectable()
export class AuthGuard implements CanActivate {
  constructor(
    private jwtService: JwtService,
    private reflector: Reflector,
  ) {}

  /**
   * Checks if the request has a valid JWT token in the Authorization header.
   * If the route is public (decorated with @SkipAuth), it skips authentication.
   * @param context Execution context of the request
   * @returns true if the request is authenticated or public, false otherwise
   */
  async canActivate(context: ExecutionContext): Promise<boolean> {
    // Check if the route is decorated with @SkipAuth, if so skip authentication check and return true
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) {
      return true;
    }

    const isOptional = this.reflector.getAllAndOverride<boolean>(
      IS_AUTH_OPTIONAL_KEY,
      [context.getHandler(), context.getClass()],
    );

    // If the route is not public, we proceed with authentication
    const request = context.switchToHttp().getRequest<Request>();
    const token = this.extractTokenFromHeader(request);

    if (!token && isOptional) {
      return true;
    }

    if (!token) {
      throw new UnauthorizedException();
    }

    try {
      const payload = await this.jwtService.verifyAsync(token);
      request["token"] = payload;
    } catch {
      // If auth is optional but failed to verify, we still reject the request
      throw new UnauthorizedException();
    }
    return true;
  }

  /**
   * Extracts the JWT token from the Authorization header of the request.
   * @param request The HTTP request object
   * @returns The extracted token or undefined if not found
   */
  private extractTokenFromHeader(request: Request): string | undefined {
    const [type, token] = request.headers.authorization?.split(" ") ?? [];
    return type === "Bearer" ? token : undefined;
  }
}
