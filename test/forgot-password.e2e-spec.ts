import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../src/entity/user.entity';
import { Otp } from '../src/entity/otp.entity';
import * as bcrypt from 'bcrypt';

describe('Forgot Password Flow (e2e)', () => {
  let app: INestApplication;
  let userRepository: Repository<User>;
  let otpRepository: Repository<Otp>;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ whitelist: true }));
    await app.init();

    userRepository = moduleFixture.get(getRepositoryToken(User));
    otpRepository = moduleFixture.get(getRepositoryToken(Otp));
  });

  afterAll(async () => {
    await app.close();
  });

  describe('POST /auth/forgot-password', () => {
    let testUser: User;

    beforeEach(async () => {
      // Create a test user
      const hashedPassword = await bcrypt.hash('OldPassword123!', 10);
      testUser = userRepository.create({
        username: 'testuser',
        email: 'test@example.com',
        firstName: 'Test',
        lastName: 'User',
        password: hashedPassword,
        phone: '1234567890',
        isEmailVerified: true,
      });
      await userRepository.save(testUser);
    });

    afterEach(async () => {
      // Clean up
      await otpRepository.delete({ email: testUser.email });
      await userRepository.delete({ id: testUser.id });
    });

    it('should send OTP for existing email', async () => {
      const response = await request(app.getHttpServer())
        .post('/auth/forgot-password')
        .send({ email: testUser.email })
        .expect(201);

      expect(response.body.message).toBe(
        'Password reset code sent to email.',
      );

      // Verify OTP was created in database
      const otp = await otpRepository.findOne({
        where: { email: testUser.email },
      });
      expect(otp).toBeDefined();
      expect(otp.code).toHaveLength(6);
    });

    it('should not reveal non-existent email', async () => {
      const response = await request(app.getHttpServer())
        .post('/auth/forgot-password')
        .send({ email: 'nonexistent@example.com' })
        .expect(201);

      expect(response.body.message).toBe(
        'If the email exists, a reset code will be sent.',
      );
    });

    it('should validate email format', async () => {
      await request(app.getHttpServer())
        .post('/auth/forgot-password')
        .send({ email: 'invalid-email' })
        .expect(400);
    });

    it('should enforce rate limiting', async () => {
      // Make multiple requests in quick succession
      for (let i = 0; i < 4; i++) {
        await request(app.getHttpServer())
          .post('/auth/forgot-password')
          .send({ email: testUser.email });
      }

      // The 4th or 5th request should be rate limited
      const response = await request(app.getHttpServer())
        .post('/auth/forgot-password')
        .send({ email: testUser.email });

      expect([429, 400]).toContain(response.status);
    }, 10000);
  });

  describe('POST /auth/reset-password', () => {
    let testUser: User;
    let validOtp: string;

    beforeEach(async () => {
      // Create a test user
      const hashedPassword = await bcrypt.hash('OldPassword123!', 10);
      testUser = userRepository.create({
        username: 'resetuser',
        email: 'reset@example.com',
        firstName: 'Reset',
        lastName: 'User',
        password: hashedPassword,
        phone: '1234567890',
        isEmailVerified: true,
      });
      await userRepository.save(testUser);

      // Request password reset to get OTP
      await request(app.getHttpServer())
        .post('/auth/forgot-password')
        .send({ email: testUser.email });

      // Get the OTP from database
      const otp = await otpRepository.findOne({
        where: { email: testUser.email },
        order: { createdAt: 'DESC' },
      });
      validOtp = otp.code;
    });

    afterEach(async () => {
      // Clean up
      await otpRepository.delete({ email: testUser.email });
      await userRepository.delete({ id: testUser.id });
    });

    it('should reset password with valid OTP', async () => {
      const response = await request(app.getHttpServer())
        .post('/auth/reset-password')
        .send({
          email: testUser.email,
          otp: validOtp,
          newPassword: 'NewSecurePass123!',
        })
        .expect(201);

      expect(response.body.message).toContain('Password reset successful');

      // Verify password was updated
      const updatedUser = await userRepository.findOne({
        where: { id: testUser.id },
      });
      const isNewPasswordValid = await bcrypt.compare(
        'NewSecurePass123!',
        updatedUser.password,
      );
      expect(isNewPasswordValid).toBe(true);
    });

    it('should reject invalid OTP', async () => {
      const response = await request(app.getHttpServer())
        .post('/auth/reset-password')
        .send({
          email: testUser.email,
          otp: '000000',
          newPassword: 'NewSecurePass123!',
        })
        .expect(400);

      expect(response.body.message).toBeDefined();
    });

    it('should reject weak passwords', async () => {
      await request(app.getHttpServer())
        .post('/auth/reset-password')
        .send({
          email: testUser.email,
          otp: validOtp,
          newPassword: 'weak',
        })
        .expect(400);
    });

    it('should reject passwords without special characters', async () => {
      await request(app.getHttpServer())
        .post('/auth/reset-password')
        .send({
          email: testUser.email,
          otp: validOtp,
          newPassword: 'NoSpecialChar123',
        })
        .expect(400);
    });

    it('should lock OTP after max attempts', async () => {
      // Make multiple failed attempts
      for (let i = 0; i < 5; i++) {
        await request(app.getHttpServer())
          .post('/auth/reset-password')
          .send({
            email: testUser.email,
            otp: '000000',
            newPassword: 'NewSecurePass123!',
          });
      }

      // Next attempt should be locked
      const response = await request(app.getHttpServer())
        .post('/auth/reset-password')
        .send({
          email: testUser.email,
          otp: validOtp,
          newPassword: 'NewSecurePass123!',
        })
        .expect(400);

      expect(response.body.message).toContain('locked');
    });
  });
});

