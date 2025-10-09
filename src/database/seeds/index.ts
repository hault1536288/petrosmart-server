import { DataSource } from 'typeorm';
import { UserSeeder } from './user.seed';

export class DatabaseSeeder {
  private dataSource: DataSource;

  constructor(dataSource: DataSource) {
    this.dataSource = dataSource;
  }

  public async run(): Promise<void> {
    console.log('Starting database seeding...');

    try {
      // Run user seeder
      const userSeeder = new UserSeeder();
      await userSeeder.run(this.dataSource);

      console.log('Database seeding completed successfully!');
    } catch (error) {
      console.error('Error during database seeding:', error);
      throw error;
    }
  }
}
