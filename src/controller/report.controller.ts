import { Controller, Get, Post, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { PoliciesGuard } from '../casl/policies.guard';
import { CheckPolicies } from '../casl/decorators/check-policies.decorator';
import { Action, AppAbility } from '../casl/casl-ability.factory';

@Controller('reports')
@UseGuards(JwtAuthGuard, PoliciesGuard)
export class ReportController {
  constructor() {}

  @Post()
  @CheckPolicies((ability: AppAbility) => ability.can(Action.Create, 'Reports'))
  create() {
    // Only users with 'create' permission on Reports
    return { message: 'Report created' };
  }

  @Get()
  @CheckPolicies((ability: AppAbility) => ability.can(Action.Read, 'Reports'))
  findAll() {
    // Only users with 'read' permission on Reports
    return { message: 'All reports' };
  }
}
