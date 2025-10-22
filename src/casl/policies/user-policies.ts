import { Action, AppAbility } from '../casl-ability.factory';
import { User } from '../../entity/user.entity';

export class ReadUserPolicy {
  handle(ability: AppAbility) {
    return ability.can(Action.Read, User);
  }
}

export class CreateUserPolicy {
  handle(ability: AppAbility) {
    return ability.can(Action.Create, User);
  }
}

export class UpdateUserPolicy {
  handle(ability: AppAbility) {
    return ability.can(Action.Update, User);
  }
}

export class DeleteUserPolicy {
  handle(ability: AppAbility) {
    return ability.can(Action.Delete, User);
  }
}
