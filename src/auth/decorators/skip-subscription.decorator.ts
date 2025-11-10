import { SetMetadata } from '@nestjs/common';

/**
 * Decorator to skip subscription check for specific routes
 * Use this on routes that should be accessible even without active subscription
 * (e.g., payment pages, subscription management)
 */
export const SkipSubscription = () => SetMetadata('skipSubscription', true);

