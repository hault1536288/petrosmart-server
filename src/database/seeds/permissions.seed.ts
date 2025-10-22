import { DataSource } from 'typeorm';
import {
  Permission,
  PermissionAction,
  PermissionResource,
} from '../../entity/permissions.entity';

export class PermissionSeeder {
  public async run(dataSource: DataSource): Promise<void> {
    const permissionRepository = dataSource.getRepository(Permission);

    const existingPermissions = await permissionRepository.count();
    if (existingPermissions > 0) {
      console.log('Permissions already exist, skipping seeding...');
      return;
    }

    const permissions = [
      // User permissions
      {
        name: 'create:users',
        action: PermissionAction.CREATE,
        resource: PermissionResource.USERS,
        description: 'Create new users',
      },
      {
        name: 'read:users',
        action: PermissionAction.READ,
        resource: PermissionResource.USERS,
        description: 'View users',
      },
      {
        name: 'update:users',
        action: PermissionAction.UPDATE,
        resource: PermissionResource.USERS,
        description: 'Update users',
      },
      {
        name: 'delete:users',
        action: PermissionAction.DELETE,
        resource: PermissionResource.USERS,
        description: 'Delete users',
      },

      // Role permissions
      {
        name: 'manage:roles',
        action: PermissionAction.MANAGE,
        resource: PermissionResource.ROLES,
        description: 'Manage roles',
      },
      {
        name: 'read:roles',
        action: PermissionAction.READ,
        resource: PermissionResource.ROLES,
        description: 'View roles',
      },

      // Settings permissions
      {
        name: 'manage:settings',
        action: PermissionAction.MANAGE,
        resource: PermissionResource.SETTINGS,
        description: 'Manage settings',
      },
      {
        name: 'read:settings',
        action: PermissionAction.READ,
        resource: PermissionResource.SETTINGS,
        description: 'View settings',
      },

      // Reports permissions
      {
        name: 'create:reports',
        action: PermissionAction.CREATE,
        resource: PermissionResource.REPORTS,
        description: 'Create reports',
      },
      {
        name: 'read:reports',
        action: PermissionAction.READ,
        resource: PermissionResource.REPORTS,
        description: 'View reports',
      },

      // All permissions (Super Admin)
      {
        name: 'manage:all',
        action: PermissionAction.MANAGE,
        resource: PermissionResource.ALL,
        description: 'Full system access',
      },
    ];

    for (const permissionData of permissions) {
      const permission = permissionRepository.create(permissionData);
      await permissionRepository.save(permission);
      console.log(`Created permission: ${permission.name}`);
    }

    console.log(`Successfully seeded ${permissions.length} permissions`);
  }
}
