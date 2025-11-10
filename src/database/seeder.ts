import { DataSource } from 'typeorm';
import { User } from '../entity/user.entity';
import { Otp } from '../entity/otp.entity';
import { Role } from '../entity/roles.entity';
import { Station } from '../entity/station.entity';
import { Product } from '../entity/product.entity';
import { Inventory } from '../entity/inventory.entity';
import { InventoryTransaction } from '../entity/inventory-transaction.entity';
import { Invitation } from '../entity/invitation.entity';
import { Subscription } from '../entity/subscription.entity';
import { DatabaseSeeder } from './seeds';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config();

console.log('Environment variables:');
console.log('DB_HOST:', process.env.DB_HOST);
console.log('DB_PORT:', process.env.DB_PORT);
console.log('DB_USERNAME:', process.env.DB_USERNAME);
console.log('DB_PASSWORD:', process.env.DB_PASSWORD ? '***' : 'undefined');
console.log('DB_NAME:', process.env.DB_NAME);

const dataSource = new DataSource({
  type: 'postgres',
  host: String(process.env.DB_HOST || 'localhost'),
  port: parseInt(process.env.DB_PORT || '5432'),
  username: String(process.env.DB_USERNAME || 'petrosmart_user'),
  password: String(process.env.DB_PASSWORD || 'petrosmart_password'),
  database: String(process.env.DB_NAME || 'petrosmart_db'),
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
  synchronize: true, // Enable synchronization to create tables
  logging: true,
});

async function runSeeder() {
  try {
    console.log('Connecting to database...');
    await dataSource.initialize();
    console.log('Database connection established');

    const seeder = new DatabaseSeeder(dataSource);
    await seeder.run();

    console.log('Seeding process completed');
  } catch (error) {
    console.error('Error during seeding process:', error);
    process.exit(1);
  } finally {
    if (dataSource.isInitialized) {
      await dataSource.destroy();
      console.log('Database connection closed');
    }
  }
}

// Run the seeder if this file is executed directly
if (require.main === module) {
  runSeeder();
}

export { runSeeder };
