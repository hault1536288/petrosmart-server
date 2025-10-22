import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Role, RoleType } from '../entity/roles.entity';

@Injectable()
export class RoleService {
  constructor(
    @InjectRepository(Role)
    private roleRepository: Repository<Role>,
  ) {}

  async findAll(): Promise<Role[]> {
    return this.roleRepository.find();
  }

  async findByName(name: RoleType): Promise<Role | null | undefined> {
    return this.roleRepository.findOne({ where: { name } });
  }

  async findById(id: number): Promise<Role | null | undefined> {
    return this.roleRepository.findOne({ where: { id } });
  }

  async getDefaultRole(): Promise<Role | null | undefined> {
    return this.findByName(RoleType.USER);
  }

  async findOne(name: RoleType): Promise<Role | null | undefined> {
    return this.roleRepository.findOne({ where: { name } });
  }
}
