import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThan } from 'typeorm';
import {
  Subscription,
  SubscriptionPlan,
  SubscriptionStatus,
} from '../entity/subscription.entity';
import {
  CreateSubscriptionDto,
  UpdateSubscriptionDto,
  UpgradeSubscriptionDto,
  CancelSubscriptionDto,
  SubscriptionResponseDto,
  PaymentDto,
} from '../dtos/subscription.dto';
import {
  ResourceNotFoundException,
  InvalidOperationException,
} from '../exceptions/custom-exceptions';

@Injectable()
export class SubscriptionService {
  constructor(
    @InjectRepository(Subscription)
    private subscriptionRepository: Repository<Subscription>,
  ) {}

  /**
   * Get plan pricing and features
   */
  private getPlanDetails(plan: SubscriptionPlan): {
    price: number;
    features: any;
  } {
    const planDetails = {
      [SubscriptionPlan.FREE]: {
        price: 0,
        features: {
          maxStations: 1,
          maxStaff: 3,
          maxTransactionsPerMonth: 100,
          hasAdvancedReporting: false,
          hasApiAccess: false,
          hasPrioritySupport: false,
        },
      },
      [SubscriptionPlan.BASIC]: {
        price: 49.99,
        features: {
          maxStations: 3,
          maxStaff: 10,
          maxTransactionsPerMonth: 1000,
          hasAdvancedReporting: false,
          hasApiAccess: false,
          hasPrioritySupport: false,
        },
      },
      [SubscriptionPlan.PROFESSIONAL]: {
        price: 149.99,
        features: {
          maxStations: 10,
          maxStaff: 50,
          maxTransactionsPerMonth: 10000,
          hasAdvancedReporting: true,
          hasApiAccess: true,
          hasPrioritySupport: false,
        },
      },
      [SubscriptionPlan.ENTERPRISE]: {
        price: 499.99,
        features: {
          maxStations: 999,
          maxStaff: 999,
          maxTransactionsPerMonth: 999999,
          hasAdvancedReporting: true,
          hasApiAccess: true,
          hasPrioritySupport: true,
        },
      },
    };

    return planDetails[plan];
  }

  /**
   * Create a new subscription
   */
  async createSubscription(
    createSubscriptionDto: CreateSubscriptionDto,
  ): Promise<Subscription> {
    const planDetails = this.getPlanDetails(createSubscriptionDto.plan);
    const now = new Date();

    // Calculate trial end date (default 14 days)
    const trialDays = createSubscriptionDto.trialDays || 14;
    const trialEndDate = new Date();
    trialEndDate.setDate(trialEndDate.getDate() + trialDays);

    // Calculate first billing date (after trial)
    const nextBillingDate = new Date(trialEndDate);

    // Create subscription
    const subscription = this.subscriptionRepository.create({
      userId: createSubscriptionDto.userId,
      plan: createSubscriptionDto.plan,
      status: SubscriptionStatus.TRIAL,
      monthlyPrice: createSubscriptionDto.monthlyPrice || planDetails.price,
      startDate: now,
      trialEndDate,
      nextBillingDate,
      autoRenew: createSubscriptionDto.autoRenew ?? true,
      maxStations: planDetails.features.maxStations,
      maxStaff: planDetails.features.maxStaff,
      maxTransactionsPerMonth: planDetails.features.maxTransactionsPerMonth,
      hasAdvancedReporting: planDetails.features.hasAdvancedReporting,
      hasApiAccess: planDetails.features.hasApiAccess,
      hasPrioritySupport: planDetails.features.hasPrioritySupport,
    });

    return this.subscriptionRepository.save(subscription);
  }

  /**
   * Get subscription by ID
   */
  async findOne(id: number): Promise<Subscription | null> {
    return this.subscriptionRepository.findOne({ where: { id } });
  }

  /**
   * Get subscription by user ID
   */
  async findByUserId(userId: number): Promise<Subscription | null> {
    return this.subscriptionRepository.findOne({ where: { userId } });
  }

  /**
   * Get all subscriptions
   */
  async findAll(status?: SubscriptionStatus): Promise<Subscription[]> {
    if (status) {
      return this.subscriptionRepository.find({
        where: { status },
        order: { createdAt: 'DESC' },
      });
    }
    return this.subscriptionRepository.find({
      order: { createdAt: 'DESC' },
    });
  }

  /**
   * Update subscription
   */
  async updateSubscription(
    id: number,
    updateSubscriptionDto: UpdateSubscriptionDto,
  ): Promise<Subscription> {
    const subscription = await this.findOne(id);
    if (!subscription) {
      throw new ResourceNotFoundException('Subscription');
    }

    // If plan is changing, update features
    if (updateSubscriptionDto.plan) {
      const planDetails = this.getPlanDetails(updateSubscriptionDto.plan);
      Object.assign(subscription, {
        ...updateSubscriptionDto,
        monthlyPrice: updateSubscriptionDto.monthlyPrice || planDetails.price,
        ...planDetails.features,
      });
    } else {
      Object.assign(subscription, updateSubscriptionDto);
    }

    return this.subscriptionRepository.save(subscription);
  }

  /**
   * Upgrade/downgrade subscription plan
   */
  async upgradePlan(
    userId: number,
    upgradeDto: UpgradeSubscriptionDto,
  ): Promise<Subscription> {
    const subscription = await this.findByUserId(userId);
    if (!subscription) {
      throw new ResourceNotFoundException('Subscription');
    }

    if (!subscription.isActive()) {
      throw new InvalidOperationException(
        'Cannot upgrade an inactive subscription',
      );
    }

    const planDetails = this.getPlanDetails(upgradeDto.newPlan);

    // Update to new plan
    subscription.plan = upgradeDto.newPlan;
    subscription.monthlyPrice = planDetails.price;
    Object.assign(subscription, planDetails.features);

    // If upgrading from trial, activate immediately
    if (subscription.status === SubscriptionStatus.TRIAL) {
      subscription.status = SubscriptionStatus.ACTIVE;
      subscription.trialEndDate = undefined;
    }

    return this.subscriptionRepository.save(subscription);
  }

  /**
   * Cancel subscription
   */
  async cancelSubscription(
    userId: number,
    cancelDto: CancelSubscriptionDto,
  ): Promise<Subscription> {
    const subscription = await this.findByUserId(userId);
    if (!subscription) {
      throw new ResourceNotFoundException('Subscription');
    }

    subscription.status = SubscriptionStatus.CANCELLED;
    subscription.cancelledAt = new Date();
    subscription.autoRenew = false;

    if (cancelDto.reason) {
      subscription.notes = subscription.notes
        ? `${subscription.notes}\nCancellation reason: ${cancelDto.reason}`
        : `Cancellation reason: ${cancelDto.reason}`;
    }

    // If cancel immediately, set end date to now
    if (cancelDto.cancelImmediately) {
      subscription.endDate = new Date();
    }
    // Otherwise, let it run until the end of billing period
    else if (!subscription.endDate) {
      subscription.endDate = subscription.nextBillingDate;
    }

    return this.subscriptionRepository.save(subscription);
  }

  /**
   * Reactivate cancelled subscription
   */
  async reactivateSubscription(userId: number): Promise<Subscription> {
    const subscription = await this.findByUserId(userId);
    if (!subscription) {
      throw new ResourceNotFoundException('Subscription');
    }

    if (subscription.status !== SubscriptionStatus.CANCELLED) {
      throw new InvalidOperationException(
        'Can only reactivate cancelled subscriptions',
      );
    }

    subscription.status = SubscriptionStatus.ACTIVE;
    subscription.cancelledAt = undefined;
    subscription.autoRenew = true;

    // Extend subscription by 30 days
    const newEndDate = new Date();
    newEndDate.setDate(newEndDate.getDate() + 30);
    subscription.endDate = newEndDate;
    subscription.nextBillingDate = newEndDate;

    return this.subscriptionRepository.save(subscription);
  }

  /**
   * Record a payment
   */
  async recordPayment(paymentDto: PaymentDto): Promise<Subscription> {
    const subscription = await this.findOne(paymentDto.subscriptionId);
    if (!subscription) {
      throw new ResourceNotFoundException('Subscription');
    }

    subscription.lastPaymentDate = new Date();
    subscription.lastPaymentAmount = paymentDto.amount;
    subscription.paymentMethod = paymentDto.paymentMethod;
    subscription.failedPaymentAttempts = 0;

    // If payment successful, activate subscription
    if (
      subscription.status === SubscriptionStatus.TRIAL ||
      subscription.status === SubscriptionStatus.PAST_DUE
    ) {
      subscription.status = SubscriptionStatus.ACTIVE;
    }

    // Extend next billing date by 30 days
    const nextBilling = new Date();
    nextBilling.setDate(nextBilling.getDate() + 30);
    subscription.nextBillingDate = nextBilling;

    // Extend end date by 30 days
    const endDate = new Date();
    endDate.setDate(endDate.getDate() + 30);
    subscription.endDate = endDate;

    return this.subscriptionRepository.save(subscription);
  }

  /**
   * Mark payment as failed
   */
  async recordFailedPayment(subscriptionId: number): Promise<Subscription> {
    const subscription = await this.findOne(subscriptionId);
    if (!subscription) {
      throw new ResourceNotFoundException('Subscription');
    }

    subscription.failedPaymentAttempts += 1;

    // After 3 failed attempts, mark as past due
    if (subscription.failedPaymentAttempts >= 3) {
      subscription.status = SubscriptionStatus.PAST_DUE;
    }

    // After 5 failed attempts, suspend
    if (subscription.failedPaymentAttempts >= 5) {
      subscription.status = SubscriptionStatus.SUSPENDED;
    }

    return this.subscriptionRepository.save(subscription);
  }

  /**
   * Check and update expired subscriptions (run as cron job)
   */
  async checkExpiredSubscriptions(): Promise<number> {
    const now = new Date();

    // Find subscriptions that have expired
    const expiredSubscriptions = await this.subscriptionRepository.find({
      where: {
        status: SubscriptionStatus.ACTIVE,
        endDate: LessThan(now),
      },
    });

    for (const subscription of expiredSubscriptions) {
      if (subscription.autoRenew) {
        // Try to auto-renew (in real implementation, charge payment method)
        subscription.status = SubscriptionStatus.PAST_DUE;
      } else {
        subscription.status = SubscriptionStatus.EXPIRED;
      }
      await this.subscriptionRepository.save(subscription);
    }

    // Check trial subscriptions
    const expiredTrials = await this.subscriptionRepository.find({
      where: {
        status: SubscriptionStatus.TRIAL,
        trialEndDate: LessThan(now),
      },
    });

    for (const subscription of expiredTrials) {
      subscription.status = SubscriptionStatus.EXPIRED;
      await this.subscriptionRepository.save(subscription);
    }

    return expiredSubscriptions.length + expiredTrials.length;
  }

  /**
   * Get subscription with formatted response
   */
  async getSubscriptionResponse(
    userId: number,
  ): Promise<SubscriptionResponseDto | null> {
    const subscription = await this.findByUserId(userId);
    if (!subscription) return null;

    return {
      id: subscription.id,
      userId: subscription.userId,
      plan: subscription.plan,
      status: subscription.status,
      monthlyPrice: subscription.monthlyPrice,
      startDate: subscription.startDate,
      endDate: subscription.endDate,
      trialEndDate: subscription.trialEndDate,
      nextBillingDate: subscription.nextBillingDate,
      isActive: subscription.isActive(),
      daysUntilExpiration: subscription.daysUntilExpiration(),
      features: {
        maxStations: subscription.maxStations,
        maxStaff: subscription.maxStaff,
        maxTransactionsPerMonth: subscription.maxTransactionsPerMonth,
        hasAdvancedReporting: subscription.hasAdvancedReporting,
        hasApiAccess: subscription.hasApiAccess,
        hasPrioritySupport: subscription.hasPrioritySupport,
      },
    };
  }

  /**
   * Check if user has an active subscription
   */
  async hasActiveSubscription(userId: number): Promise<boolean> {
    const subscription = await this.findByUserId(userId);
    return subscription ? subscription.isActive() : false;
  }

  /**
   * Get subscription statistics
   */
  async getStatistics(): Promise<any> {
    const total = await this.subscriptionRepository.count();
    const active = await this.subscriptionRepository.count({
      where: { status: SubscriptionStatus.ACTIVE },
    });
    const trial = await this.subscriptionRepository.count({
      where: { status: SubscriptionStatus.TRIAL },
    });
    const cancelled = await this.subscriptionRepository.count({
      where: { status: SubscriptionStatus.CANCELLED },
    });
    const expired = await this.subscriptionRepository.count({
      where: { status: SubscriptionStatus.EXPIRED },
    });

    return {
      total,
      active,
      trial,
      cancelled,
      expired,
      churnRate: total > 0 ? ((cancelled + expired) / total) * 100 : 0,
    };
  }
}
