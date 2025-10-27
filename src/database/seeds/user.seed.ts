import { DataSource } from 'typeorm';
import { User } from '../../entity/user.entity';

export class UserSeeder {
  public async run(dataSource: DataSource): Promise<void> {
    const userRepository = dataSource.getRepository(User);

    // Check if users already exist
    const existingUsers = await userRepository.count();
    if (existingUsers > 0) {
      console.log('Users already exist, skipping seeding...');
      return;
    }

    const users = [
      {
        username: 'john.doe',
        email: 'john.doe@example.com',
        firstName: 'John',
        lastName: 'Doe',
        phone: '+1234567890',
        password: 'password123',
      },
      {
        username: 'jane.smith',
        email: 'jane.smith@example.com',
        firstName: 'Jane',
        lastName: 'Smith',
        phone: '+0987654321',
        password: 'password123',
      },
      {
        username: 'mike.johnson',
        email: 'mike.johnson@example.com',
        firstName: 'Mike',
        lastName: 'Johnson',
        phone: '+1122334455',
        password: 'password123',
      },
      {
        username: 'sarah.wilson',
        email: 'sarah.wilson@example.com',
        firstName: 'Sarah',
        lastName: 'Wilson',
        phone: '+5566778899',
        password: 'password123',
      },
      {
        username: 'david.brown',
        email: 'david.brown@example.com',
        firstName: 'David',
        lastName: 'Brown',
        phone: '+9988776655',
        password: 'password123',
      },
    ];

    for (const userData of users) {
      const user = userRepository.create(userData);
      await userRepository.save(user);
      console.log(
        `Created user: ${user.firstName} ${user.lastName} (${user.email})`,
      );
    }

    console.log(`Successfully seeded ${users.length} users`);
  }
}
