import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  UseGuards,
  Request,
  ForbiddenException,
} from '@nestjs/common';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { PoliciesGuard } from '../casl/policies.guard';
import { CheckPolicies } from '../casl/decorators/check-policies.decorator';
import { Action, AppAbility } from '../casl/casl-ability.factory';
import { User } from '../entity/user.entity';
import { CaslAbilityFactory } from '../casl/casl-ability.factory';
import { UserService } from 'src/services/user.service';
import { CreateUserDto } from 'src/dtos/create-user.dto';
import { UpdateUserDto } from 'src/dtos/update-user.dto';

@Controller('users')
@UseGuards(JwtAuthGuard, PoliciesGuard)
export class UserController {
  constructor(
    private userService: UserService,
    private caslAbilityFactory: CaslAbilityFactory,
  ) {}

  @Get()
  @CheckPolicies((ability: AppAbility) => ability.can(Action.Read, User))
  async findAll(@Request() req) {
    const ability = this.caslAbilityFactory.createForUser(req.user);

    if (ability.cannot(Action.Read, User) as boolean) {
      throw new ForbiddenException('Cannot read users');
    }

    return this.userService.findAll();
  }

  @Get(':id')
  @CheckPolicies((ability: AppAbility) => ability.can(Action.Read, User))
  async findOne(@Param('id') id: string, @Request() req) {
    const ability = this.caslAbilityFactory.createForUser(req.user);

    if (ability.cannot(Action.Read, User) as boolean) {
      throw new ForbiddenException('Cannot read this user');
    }
    return this.userService.findOne(+id);
  }

  @Post()
  @CheckPolicies((ability: AppAbility) => ability.can(Action.Create, User))
  create(@Body() createUserDto: CreateUserDto) {
    return this.userService.create(createUserDto);
  }

  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body() updateUserDto: UpdateUserDto,
    @Request() req,
  ) {
    const user = await this.userService.findOne(+id);
    const ability = this.caslAbilityFactory.createForUser(req.user);

    if (ability.cannot(Action.Update, user!) as boolean) {
      throw new ForbiddenException('Cannot update this user');
    }

    return this.userService.update(+id, updateUserDto);
  }

  @Delete(':id')
  @CheckPolicies((ability: AppAbility) => ability.can(Action.Delete, User))
  async remove(@Param('id') id: string, @Request() req) {
    const user = await this.userService.findOne(+id);
    const ability = this.caslAbilityFactory.createForUser(req.user);

    if (ability.cannot(Action.Delete, user!) as boolean) {
      throw new ForbiddenException('Cannot delete this user');
    }

    await this.userService.remove(+id);
    return { message: 'User deleted successfully' };
  }
}
