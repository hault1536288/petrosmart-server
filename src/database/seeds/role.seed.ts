import { DataSource } from 'typeorm';
import { Role, RoleType } from '../../entity/roles.entity';
import { Permission } from '../../entity/permissions.entity';

export class RoleSeeder {
  public async run(dataSource: DataSource): Promise<void> {
    const roleRepository = dataSource.getRepository(Role);
    const permissionRepository = dataSource.getRepository(Permission);

    const existingRoles = await roleRepository.count();
    if (existingRoles > 0) {
      console.log('Roles already exist, skipping seeding...');
      return;
    }

    // Get permissions
    const allPermissions = await permissionRepository.find();
    const permissionMap = new Map(allPermissions.map((p) => [p.name, p]));

    // Define roles with their permissions
    const roles = [
      {
        name: RoleType.SUPER_ADMIN,
        displayName: 'Super Administrator',
        description: 'Full system access',
        permissions: ['manage:all'],
      },
      {
        name: RoleType.ADMIN,
        displayName: 'Administrator',
        description: 'Organization administrator',
        permissions: [
          'create:users',
          'read:users',
          'update:users',
          'delete:users',
          'read:roles',
          'manage:settings',
          'read:settings',
          'create:reports',
          'read:reports',
        ],
      },
      {
        name: RoleType.MANAGER,
        displayName: 'Manager',
        description: 'Team manager',
        permissions: [
          'read:users',
          'update:users',
          'read:settings',
          'create:reports',
          'read:reports',
        ],
      },
      {
        name: RoleType.STAFF,
        displayName: 'Staff',
        description: 'Standard employee',
        permissions: ['read:users', 'read:settings', 'read:reports'],
      },
      {
        name: RoleType.USER,
        displayName: 'User',
        description: 'Standard user',
        permissions: ['read:settings'],
      },
      {
        name: RoleType.GUEST,
        displayName: 'Guest',
        description: 'Limited guest access',
        permissions: [],
      },
    ];

    for (const roleData of roles) {
      const permissions = roleData.permissions
        .map((name) => permissionMap.get(name))
        .filter((p): p is Permission => p !== undefined);

      const role = roleRepository.create({
        name: roleData.name,
        displayName: roleData.displayName,
        description: roleData.description,
        permissions,
      });

      await roleRepository.save(role);
      console.log(
        `Created role: ${role.displayName} with ${permissions.length} permissions`,
      );
    }

    console.log(`Successfully seeded ${roles.length} roles`);
  }
}
