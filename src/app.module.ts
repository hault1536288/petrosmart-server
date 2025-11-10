import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserModule } from './module/user.module';
import { ProductModule } from './module/product.module';
import { SubscriptionModule } from './module/subscription.module';
import { User } from './entity/user.entity';
import { Otp } from './entity/otp.entity';
import { Role } from './entity/roles.entity';
import { Station } from './entity/station.entity';
import { Product } from './entity/product.entity';
import { Inventory } from './entity/inventory.entity';
import { InventoryTransaction } from './entity/inventory-transaction.entity';
import { Invitation } from './entity/invitation.entity';
import { Subscription } from './entity/subscription.entity';
import { AuthModule } from './auth/auth.module';
import { CaslModule } from './casl/casl.module';
import { RedisModule } from './redis/redis.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: String(process.env.DB_HOST),
      port: parseInt(process.env.DB_PORT ?? '5432'),
      username: String(process.env.DB_USERNAME),
      password: String(process.env.DB_PASSWORD),
      database: String(process.env.DB_NAME),
      entities: [
        User,
        Otp,
        Role,
        Station,
        Product,
        Inventory,
        InventoryTransaction,
        Invitation,
        Subscription,
      ],
      synchronize: process.env.NODE_ENV === 'development', // Only in development
      logging: process.env.NODE_ENV === 'development',
    }),
    RedisModule,
    UserModule,
    ProductModule,
    SubscriptionModule,
    AuthModule,
    CaslModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
