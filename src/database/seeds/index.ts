import { DataSource } from 'typeorm';
import { UserSeeder } from './user.seed';
import { seedProducts } from './product-seed';

export class DatabaseSeeder {
  private dataSource: DataSource;

  constructor(dataSource: DataSource) {
    this.dataSource = dataSource;
  }

  public async run(): Promise<void> {
    console.log('Starting database seeding...');

    try {
      // Run user seeder (includes roles)
      const userSeeder = new UserSeeder();
      await userSeeder.run(this.dataSource);

      // Run product seeder
      console.log('\n📦 Seeding products...');
      await seedProducts(this.dataSource);

      console.log('\n✅ Database seeding completed successfully!');
    } catch (error) {
      console.error('❌ Error during database seeding:', error);
      throw error;
    }
  }
}
