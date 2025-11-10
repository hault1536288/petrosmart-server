import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  UseGuards,
  Request,
  ForbiddenException,
  UnauthorizedException,
  Query,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { SubscriptionService } from '../services/subscription.service';
import {
  CreateSubscriptionDto,
  UpdateSubscriptionDto,
  UpgradeSubscriptionDto,
  CancelSubscriptionDto,
  PaymentDto,
} from '../dtos/subscription.dto';
import { SubscriptionStatus } from '../entity/subscription.entity';
import { RoleType } from '../entity/roles.entity';
import { SkipSubscription } from '../auth/decorators/skip-subscription.decorator';

@Controller('subscriptions')
@UseGuards(JwtAuthGuard)
export class SubscriptionController {
  constructor(private subscriptionService: SubscriptionService) {}

  /**
   * Get current user's subscription
   */
  @Get('me')
  @SkipSubscription()
  async getMySubscription(@Request() req) {
    const subscription = await this.subscriptionService.getSubscriptionResponse(
      req.user.id,
    );

    if (!subscription) {
      return {
        message: 'No subscription found',
        subscription: null,
      };
    }

    return { subscription };
  }

  /**
   * Get all subscriptions (Super Admin only)
   */
  @Get()
  async getAllSubscriptions(
    @Request() req,
    @Query('status') status?: SubscriptionStatus,
  ) {
    const userRole = req.user?.role?.name || req.user?.roleName;

    if (userRole !== RoleType.SUPER_ADMIN) {
      throw new UnauthorizedException(
        'Only Super Admins can view all subscriptions',
      );
    }

    const subscriptions = await this.subscriptionService.findAll(status);
    return { subscriptions };
  }

  /**
   * Get subscription statistics (Super Admin only)
   */
  @Get('statistics')
  async getStatistics(@Request() req) {
    const userRole = req.user?.role?.name || req.user?.roleName;

    if (userRole !== RoleType.SUPER_ADMIN) {
      throw new UnauthorizedException(
        'Only Super Admins can view subscription statistics',
      );
    }

    const statistics = await this.subscriptionService.getStatistics();
    return { statistics };
  }

  /**
   * Get subscription by ID (Super Admin only)
   */
  @Get(':id')
  async getSubscription(@Param('id') id: string, @Request() req) {
    const userRole = req.user?.role?.name || req.user?.roleName;

    if (userRole !== RoleType.SUPER_ADMIN) {
      throw new UnauthorizedException(
        'Only Super Admins can view subscriptions',
      );
    }

    const subscription = await this.subscriptionService.findOne(+id);
    return { subscription };
  }

  /**
   * Create subscription (Super Admin only)
   * Used when manually setting up a customer
   */
  @Post()
  @SkipSubscription()
  async createSubscription(
    @Body() createSubscriptionDto: CreateSubscriptionDto,
    @Request() req,
  ) {
    const userRole = req.user?.role?.name || req.user?.roleName;

    if (userRole !== RoleType.SUPER_ADMIN) {
      throw new UnauthorizedException(
        'Only Super Admins can create subscriptions',
      );
    }

    const subscription = await this.subscriptionService.createSubscription(
      createSubscriptionDto,
    );

    return {
      message: 'Subscription created successfully',
      subscription,
    };
  }

  /**
   * Update subscription (Super Admin only)
   */
  @Patch(':id')
  @SkipSubscription()
  async updateSubscription(
    @Param('id') id: string,
    @Body() updateSubscriptionDto: UpdateSubscriptionDto,
    @Request() req,
  ) {
    const userRole = req.user?.role?.name || req.user?.roleName;

    if (userRole !== RoleType.SUPER_ADMIN) {
      throw new UnauthorizedException(
        'Only Super Admins can update subscriptions',
      );
    }

    const subscription = await this.subscriptionService.updateSubscription(
      +id,
      updateSubscriptionDto,
    );

    return {
      message: 'Subscription updated successfully',
      subscription,
    };
  }

  /**
   * Upgrade/change subscription plan
   */
  @Post('upgrade')
  @SkipSubscription()
  async upgradePlan(
    @Body() upgradeDto: UpgradeSubscriptionDto,
    @Request() req,
  ) {
    const subscription = await this.subscriptionService.upgradePlan(
      req.user.id,
      upgradeDto,
    );

    return {
      message: 'Plan upgraded successfully',
      subscription,
    };
  }

  /**
   * Cancel subscription
   */
  @Post('cancel')
  @SkipSubscription()
  async cancelSubscription(
    @Body() cancelDto: CancelSubscriptionDto,
    @Request() req,
  ) {
    const subscription = await this.subscriptionService.cancelSubscription(
      req.user.id,
      cancelDto,
    );

    return {
      message: cancelDto.cancelImmediately
        ? 'Subscription cancelled immediately'
        : 'Subscription will be cancelled at the end of billing period',
      subscription,
    };
  }

  /**
   * Reactivate cancelled subscription
   */
  @Post('reactivate')
  @SkipSubscription()
  async reactivateSubscription(@Request() req) {
    const subscription = await this.subscriptionService.reactivateSubscription(
      req.user.id,
    );

    return {
      message: 'Subscription reactivated successfully',
      subscription,
    };
  }

  /**
   * Record a payment
   */
  @Post('payments')
  @SkipSubscription()
  async recordPayment(@Body() paymentDto: PaymentDto, @Request() req) {
    // Verify user owns the subscription
    const subscription = await this.subscriptionService.findOne(
      paymentDto.subscriptionId,
    );

    const userRole = req.user?.role?.name || req.user?.roleName;

    if (
      subscription?.userId !== req.user.id &&
      userRole !== RoleType.SUPER_ADMIN
    ) {
      throw new ForbiddenException(
        'You can only record payments for your own subscription',
      );
    }

    const updatedSubscription =
      await this.subscriptionService.recordPayment(paymentDto);

    return {
      message: 'Payment recorded successfully',
      subscription: updatedSubscription,
    };
  }

  /**
   * Check expired subscriptions (Super Admin only - typically called by cron)
   */
  @Post('check-expired')
  async checkExpiredSubscriptions(@Request() req) {
    const userRole = req.user?.role?.name || req.user?.roleName;

    if (userRole !== RoleType.SUPER_ADMIN) {
      throw new UnauthorizedException(
        'Only Super Admins can check expired subscriptions',
      );
    }

    const count = await this.subscriptionService.checkExpiredSubscriptions();

    return {
      message: `Checked and updated ${count} expired subscriptions`,
      count,
    };
  }
}
