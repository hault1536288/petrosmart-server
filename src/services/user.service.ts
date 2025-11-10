import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../entity/user.entity';
import { CreateUserDto } from '../dtos/create-user.dto';
import { UpdateUserDto } from '../dtos/update-user.dto';
import { CreateAdminDto } from '../dtos/create-admin.dto';
import { CreateStaffDto } from '../dtos/create-staff.dto';
import { RoleService } from './role.service';
import { RoleType } from '../entity/roles.entity';
import { DuplicateResourceException } from '../exceptions/custom-exceptions';
import { SubscriptionService } from './subscription.service';
import { SubscriptionPlan } from '../entity/subscription.entity';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    private roleService: RoleService,
    private subscriptionService: SubscriptionService,
  ) {}

  async findByUsername(username: string): Promise<User | null> {
    return this.userRepository.findOne({ where: { username } });
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.userRepository.findOne({ where: { email } });
  }

  async findByGoogleId(googleId: string): Promise<User | null> {
    return this.userRepository.findOne({ where: { googleId } });
  }

  async create(createUserDto: CreateUserDto): Promise<User> {
    const user = this.userRepository.create(createUserDto);
    return this.userRepository.save(user);
  }

  async findAll(): Promise<User[]> {
    return this.userRepository.find();
  }

  async findOne(id: number): Promise<User | null> {
    return this.userRepository.findOne({ where: { id } });
  }

  async update(id: number, updateUserDto: UpdateUserDto): Promise<User | null> {
    await this.userRepository.update(id, updateUserDto);
    return this.findOne(id)!;
  }

  async remove(id: number): Promise<void> {
    await this.userRepository.delete(id);
  }

  /**
   * Create an admin user (only accessible by Super Admins)
   */
  async createAdmin(createAdminDto: CreateAdminDto): Promise<User> {
    // Check for duplicate username
    const existingUsername = await this.findByUsername(createAdminDto.username);
    if (existingUsername) {
      throw new DuplicateResourceException(
        'Username already exists',
        'username',
      );
    }

    // Check for duplicate email
    const existingEmail = await this.findByEmail(createAdminDto.email);
    if (existingEmail) {
      throw new DuplicateResourceException('Email already exists', 'email');
    }

    // Get Admin role
    const adminRole = await this.roleService.findByName(RoleType.ADMIN);
    if (!adminRole) {
      throw new Error('Admin role not found in database');
    }

    // Create user with admin role
    const user = this.userRepository.create({
      ...createAdminDto,
      roleId: adminRole.id,
      isEmailVerified: true, // Admins are auto-verified
    });

    const savedUser = await this.userRepository.save(user);

    // Create subscription for admin (SaaS customer)
    await this.subscriptionService.createSubscription({
      userId: savedUser.id,
      plan: createAdminDto.subscriptionPlan || SubscriptionPlan.BASIC,
      trialDays: createAdminDto.trialDays || 14,
    });

    // Return saved user
    return savedUser;
  }

  /**
   * Create a staff user (accessible by Super Admins and Admins)
   */
  async createStaff(createStaffDto: CreateStaffDto): Promise<User> {
    // Check for duplicate username
    const existingUsername = await this.findByUsername(createStaffDto.username);
    if (existingUsername) {
      throw new DuplicateResourceException(
        'Username already exists',
        'username',
      );
    }

    // Check for duplicate email
    const existingEmail = await this.findByEmail(createStaffDto.email);
    if (existingEmail) {
      throw new DuplicateResourceException('Email already exists', 'email');
    }

    // Get Staff role
    const staffRole = await this.roleService.findByName(RoleType.STAFF);
    if (!staffRole) {
      throw new Error('Staff role not found in database');
    }

    // Create user with staff role
    const user = this.userRepository.create({
      ...createStaffDto,
      roleId: staffRole.id,
      isEmailVerified: true, // Staff are auto-verified
    });

    return this.userRepository.save(user);
  }
}
