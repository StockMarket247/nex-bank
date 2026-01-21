import { Injectable, UnauthorizedException, BadRequestException, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import { User, UserDocument, AccountTier } from '../database/schemas/user.schema';
import { Admin, AdminDocument } from '../database/schemas/admin.schema';
import { LoginDto, RegisterDto, RefreshTokenDto } from './dto';
import { AccountsService } from '../accounts/accounts.service';
import { AccountType } from '../database/schemas/bank-account.schema';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    @InjectModel(Admin.name) private adminModel: Model<AdminDocument>,
    private jwtService: JwtService,
    private configService: ConfigService,
    private accountsService: AccountsService,
  ) {}

  async register(dto: RegisterDto) {
    // Normalize email (lowercase and trim)
    const email = dto.email.trim().toLowerCase();
    const password = dto.password.trim();

    if (!password || password.length < 8) {
      throw new BadRequestException('Password must be at least 8 characters long');
    }

    const existingUser = await this.userModel.findOne({ email });
    if (existingUser) {
      throw new BadRequestException('User with this email already exists');
    }

    // Hash password with bcrypt
    const hashedPassword = await bcrypt.hash(password, 10);
    
    // Verify the hash was created successfully
    if (!hashedPassword || !hashedPassword.startsWith('$2')) {
      throw new BadRequestException('Failed to hash password');
    }

    // Verify the hash can be compared (test it)
    const testCompare = await bcrypt.compare(password, hashedPassword);
    if (!testCompare) {
      this.logger.error('Registration error: Password hash verification failed during registration');
      throw new BadRequestException('Failed to verify password hash');
    }

    this.logger.log(`Registration: Password hashed successfully for email: ${email}`);
    this.logger.debug(`Registration: Hash starts with: ${hashedPassword.substring(0, 10)}`);

    const user = await this.userModel.create({
      email,
      password: hashedPassword,
      firstName: dto.firstName.trim(),
      lastName: dto.lastName.trim(),
      phone: dto.phone?.trim(),
      dateOfBirth: dto.dateOfBirth ? new Date(dto.dateOfBirth) : undefined,
      address: dto.address?.trim(),
      city: dto.city?.trim(),
      country: dto.country?.trim(),
      postalCode: dto.postalCode?.trim(),
      accountTier: AccountTier.TIER_1, // Set to Tier 1 on registration
    });

    // Save the user explicitly to ensure password is persisted
    await user.save();

    // Verify password was saved correctly by fetching from database
    const savedUser = await this.userModel.findById(user._id);
    if (savedUser && savedUser.password) {
      const verifySaved = await bcrypt.compare(password, savedUser.password);
      if (!verifySaved) {
        this.logger.error('Registration error: Saved password does not match original password');
        this.logger.error(`Registration error: Original hash: ${hashedPassword.substring(0, 20)}`);
        this.logger.error(`Registration error: Saved hash: ${savedUser.password.substring(0, 20)}`);
      } else {
        this.logger.log(`Registration: Verified saved password matches for email: ${email}`);
      }
    } else {
      this.logger.error('Registration error: Could not retrieve saved user or password');
    }

    // Automatically create a savings account for the new user
    try {
      await this.accountsService.createAccount(user._id.toString(), {
        type: AccountType.SAVINGS,
        currency: 'USD',
        initialBalance: 0,
      });
    } catch (error) {
      // Log error but don't fail registration if account creation fails
      console.error('Failed to create account during registration:', error);
    }

    const userObj = user.toObject();
    delete userObj.password;

    return {
      user: {
        id: user._id.toString(),
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        kycStatus: user.kycStatus,
        status: user.status,
        accountTier: user.accountTier,
        createdAt: (user as any).createdAt,
      },
      ...(await this.generateTokens(user._id.toString(), user.email, 'user')),
    };
  }

  async login(dto: LoginDto, isAdmin = false) {
    if (isAdmin) {
      return this.loginAdmin(dto);
    }

    // Trim email and password to avoid whitespace issues
    const email = dto.email.trim().toLowerCase();
    const password = dto.password.trim();

    if (!password) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Find user - don't use select to ensure password is included
    // Mongoose by default includes all fields unless explicitly excluded
    const user = await this.userModel.findOne({ email });
    if (!user) {
      this.logger.error(`Login error: User not found for email: ${email}`);
      throw new UnauthorizedException('Invalid credentials');
    }

    this.logger.log(`Login: User found: ${user.email}`);
    this.logger.debug(`Login: Password field exists: ${!!user.password}`);
    this.logger.debug(`Login: Password type: ${typeof user.password}`);
    this.logger.debug(`Login: Password length: ${user.password?.length}`);
    this.logger.debug(`Login: Password starts with: ${user.password?.substring(0, 10)}`);

    // Check if password exists and is a valid bcrypt hash
    if (!user.password || typeof user.password !== 'string') {
      this.logger.error(`Login error: Password field missing or invalid for user: ${email}`);
      throw new UnauthorizedException('Invalid credentials');
    }

    // Verify it's a bcrypt hash
    if (!user.password.startsWith('$2')) {
      this.logger.error(`Login error: Password is not a valid bcrypt hash for user: ${email}`);
      this.logger.error(`Login error: Password value: ${user.password}`);
      throw new UnauthorizedException('Invalid credentials');
    }

    if (user.status === 'CLOSED') {
      throw new UnauthorizedException('Account is closed');
    }

    if (user.status === 'SUSPENDED') {
      throw new UnauthorizedException('Account is suspended');
    }

    // Compare passwords
    this.logger.log(`Login: Comparing password for user: ${email}`);
    this.logger.debug(`Login: Input password length: ${password.length}`);
    this.logger.debug(`Login: Stored password hash length: ${user.password.length}`);
    
    try {
      const isPasswordValid = await bcrypt.compare(password, user.password);
      this.logger.log(`Login: Password comparison result: ${isPasswordValid}`);
      
    if (!isPasswordValid) {
        // Try comparing with the original password from registration to debug
        this.logger.error(`Login error: Password comparison failed for user: ${email}`);
        this.logger.error(`Login error: Input password (first 3 chars): ${password.substring(0, 3)}`);
        this.logger.error(`Login error: Stored hash (first 20 chars): ${user.password.substring(0, 20)}`);
        throw new UnauthorizedException('Invalid credentials');
      }
    } catch (error) {
      this.logger.error(`Login error: bcrypt.compare exception: ${error}`);
      throw new UnauthorizedException('Invalid credentials');
    }

    return {
      user: {
        id: user._id.toString(),
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        kycStatus: user.kycStatus,
        status: user.status,
        accountTier: user.accountTier,
      },
      ...(await this.generateTokens(user._id.toString(), user.email, 'user')),
    };
  }

  async loginAdmin(dto: LoginDto) {
    // Trim email and password to avoid whitespace issues
    const email = dto.email.trim().toLowerCase();
    const password = dto.password.trim();

    if (!password) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Find admin - don't use select to ensure password is included
    const admin = await this.adminModel.findOne({ email });
    if (!admin || !admin.isActive) {
      throw new UnauthorizedException('Invalid credentials');
    }

    if (!admin.password || typeof admin.password !== 'string') {
      this.logger.error(`Admin login error: Password field missing or invalid for admin: ${email}`);
      throw new UnauthorizedException('Invalid credentials');
    }

    // Verify it's a bcrypt hash
    if (!admin.password.startsWith('$2')) {
      this.logger.error(`Admin login error: Password is not a valid bcrypt hash for admin: ${email}`);
      throw new UnauthorizedException('Invalid credentials');
    }

    // Compare passwords
    try {
      const isPasswordValid = await bcrypt.compare(password, admin.password);
    if (!isPasswordValid) {
        this.logger.error(`Admin login error: Password comparison failed for admin: ${email}`);
        throw new UnauthorizedException('Invalid credentials');
      }
    } catch (error) {
      this.logger.error(`Admin login error: bcrypt.compare failed: ${error}`);
      throw new UnauthorizedException('Invalid credentials');
    }

    // Update last login
    admin.lastLoginAt = new Date();
    await admin.save();

    return {
      user: {
        id: admin._id.toString(),
        email: admin.email,
        firstName: admin.firstName,
        lastName: admin.lastName,
        role: admin.role,
      },
      ...(await this.generateTokens(admin._id.toString(), admin.email, 'admin', admin.role)),
    };
  }

  async refreshToken(dto: RefreshTokenDto) {
    try {
      const payload = this.jwtService.verify(dto.refreshToken, {
        secret: this.configService.get<string>('JWT_REFRESH_SECRET') || 'your-refresh-secret-key-change-in-production',
      });

      const tokenType = payload.type;
      let user;

      if (tokenType === 'admin') {
        const admin = await this.adminModel.findById(payload.sub);
        if (!admin || !admin.isActive) {
          throw new UnauthorizedException('Invalid refresh token');
        }
        return this.generateTokens(admin._id.toString(), admin.email, 'admin', admin.role);
      } else {
        const user = await this.userModel.findById(payload.sub);
        if (!user || user.status === 'CLOSED') {
          throw new UnauthorizedException('Invalid refresh token');
        }
        return this.generateTokens(user._id.toString(), user.email, 'user');
      }
    } catch (error) {
      throw new UnauthorizedException('Invalid refresh token');
    }
  }

  private async generateTokens(userId: string, email: string, type: 'user' | 'admin', role?: string) {
    const payload = {
      sub: userId,
      email,
      type,
      ...(role && { role }),
    };

    const accessToken = this.jwtService.sign(payload);
    const refreshToken = this.jwtService.sign(payload, {
      secret: this.configService.get<string>('JWT_REFRESH_SECRET') || 'your-refresh-secret-key-change-in-production',
      expiresIn: this.configService.get<string>('JWT_REFRESH_EXPIRES_IN') || '7d',
    });

    return {
      accessToken,
      refreshToken,
    };
  }

  async validateUser(userId: string): Promise<any> {
    const user = await this.userModel.findById(userId).select('email firstName lastName kycStatus status accountTier').lean();
    if (!user || user.status === 'CLOSED') {
      return null;
    }
    return { ...user, id: (user as any)._id.toString(), type: 'user' };
  }

  async validateAdmin(adminId: string): Promise<any> {
    const admin = await this.adminModel.findById(adminId).lean();
    if (!admin || !admin.isActive) {
      return null;
    }
    return { ...admin, id: (admin as any)._id.toString(), type: 'admin' };
  }
}

