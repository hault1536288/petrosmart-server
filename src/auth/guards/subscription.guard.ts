import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { SubscriptionService } from '../../services/subscription.service';
import { RoleType } from '../../entity/roles.entity';

/**
 * Guard to check if user has an active subscription
 * Only applies to Admin and Manager roles (SaaS customers)
 */
@Injectable()
export class SubscriptionGuard implements CanActivate {
  constructor(
    private subscriptionService: SubscriptionService,
    private reflector: Reflector,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user) {
      throw new ForbiddenException('User not authenticated');
    }

    // Check if subscription check should be skipped for this route
    const skipSubscription = this.reflector.get<boolean>(
      'skipSubscription',
      context.getHandler(),
    );

    if (skipSubscription) {
      return true;
    }

    // Only check subscription for Admins (SaaS customers)
    const userRole = user.role?.name || user.roleName;
    const rolesRequiringSubscription = [RoleType.ADMIN];

    if (!rolesRequiringSubscription.includes(userRole)) {
      // Super Admin, Staff, and Users don't need subscription
      return true;
    }

    // Check if user has active subscription
    const hasActiveSubscription =
      await this.subscriptionService.hasActiveSubscription(user.id);

    if (!hasActiveSubscription) {
      throw new ForbiddenException(
        'Your subscription has expired. Please renew your subscription to continue using the service.',
      );
    }

    // Attach subscription to request for later use
    const subscription = await this.subscriptionService.findByUserId(user.id);
    request.subscription = subscription;

    return true;
  }
}
