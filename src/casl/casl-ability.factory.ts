import {
  AbilityBuilder,
  AbilityClass,
  ExtractSubjectType,
  InferSubjects,
  PureAbility,
} from '@casl/ability';
import { Injectable } from '@nestjs/common';
import { User } from '../entity/user.entity';
import { Role, RoleType } from '../entity/roles.entity';

// Define all possible actions
export enum Action {
  Manage = 'manage', // All actions
  Create = 'create',
  Read = 'read',
  Update = 'update',
  Delete = 'delete',
}

// Define all subjects (resources)
type Subjects =
  | InferSubjects<typeof User | typeof Role>
  | 'all'
  | 'Settings'
  | 'Reports';

// Define the Ability type
export type AppAbility = PureAbility<[Action, Subjects]>;

@Injectable()
export class CaslAbilityFactory {
  createForUser(user: User) {
    const { can, cannot, build } = new AbilityBuilder<AppAbility>(
      PureAbility as AbilityClass<AppAbility>,
    );

    // Define abilities based on user role
    switch (user.role?.name) {
      case RoleType.SUPER_ADMIN:
        can(Action.Manage, 'all'); // Can do everything
        break;

      case RoleType.ADMIN:
        can(Action.Create, User);
        can(Action.Read, User);
        can(Action.Update, User);
        can(Action.Delete, User);
        can(Action.Read, Role);
        can(Action.Manage, 'Settings');
        can(Action.Manage, 'Reports');
        // Cannot manage roles
        cannot(Action.Manage, Role);
        break;

      case RoleType.MANAGER:
        can(Action.Read, User);
        can(Action.Update, User, { id: user.id }); // Can only update self
        can(Action.Read, 'Settings');
        can(Action.Create, 'Reports');
        can(Action.Read, 'Reports');
        break;

      case RoleType.STAFF:
        can(Action.Read, User, { id: user.id }); // Can only read self
        can(Action.Update, User, { id: user.id }); // Can only update self
        can(Action.Read, 'Settings');
        can(Action.Read, 'Reports');
        break;

      case RoleType.USER:
        can(Action.Read, User, { id: user.id }); // Can only read self
        can(Action.Update, User, { id: user.id }); // Can only update self
        break;

      case RoleType.GUEST:
        can(Action.Read, 'Settings'); // Read-only access
        break;
    }

    return build({
      detectSubjectType: (item) =>
        item.constructor as ExtractSubjectType<Subjects>,
    });
  }
}
