import { DataSource } from 'typeorm';
import { Role, RoleType } from '../../entity/roles.entity';

export class RoleSeeder {
  public async run(dataSource: DataSource): Promise<void> {
    const roleRepository = dataSource.getRepository(Role);

    const existingRoles = await roleRepository.count();
    if (existingRoles > 0) {
      console.log('Roles already exist, skipping seeding...');
      return;
    }

    // Define roles - permissions are now defined in CASL ability factory
    const roles = [
      {
        name: RoleType.SUPER_ADMIN,
        displayName: 'Super Administrator',
        description: 'Full system access - permissions defined in CASL',
      },
      {
        name: RoleType.ADMIN,
        displayName: 'Administrator',
        description: 'Organization administrator - permissions defined in CASL',
      },
      {
        name: RoleType.STAFF,
        displayName: 'Staff',
        description: 'Standard employee - permissions defined in CASL',
      },
      {
        name: RoleType.USER,
        displayName: 'User',
        description: 'Standard user - permissions defined in CASL',
      },
      {
        name: RoleType.GUEST,
        displayName: 'Guest',
        description: 'Limited guest access - permissions defined in CASL',
      },
    ];

    for (const roleData of roles) {
      const role = roleRepository.create(roleData);
      await roleRepository.save(role);
      console.log(`Created role: ${role.displayName}`);
    }

    console.log(`Successfully seeded ${roles.length} roles`);
  }
}
