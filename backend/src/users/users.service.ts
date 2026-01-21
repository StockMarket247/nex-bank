import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import * as bcrypt from 'bcrypt';
import * as fs from 'fs';
import * as path from 'path';
import { User, UserDocument, KYCStatus, UserStatus, AccountTier } from '../database/schemas/user.schema';
import { VerificationDocument, VerificationDocumentDocument, VerificationType, VerificationStatus, DocumentType } from '../database/schemas/verification-document.schema';
import { UpdateProfileDto, UpdateKycStatusDto, UpgradeTierDto, CreateTransferPinDto, VerifyTransferPinDto, UpdateTransferPinDto, UpgradeToTier2Dto, UpgradeToTier3Dto, UpdateVerificationStatusDto } from './dto';
import { TIER_REQUIREMENTS } from '../common/config/tier.config';

@Injectable()
export class UsersService {
  private readonly uploadsDir = path.join(process.cwd(), 'uploads', 'verification');

  constructor(
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    @InjectModel(VerificationDocument.name) private verificationDocumentModel: Model<VerificationDocumentDocument>,
  ) {
    // Ensure uploads directory exists
    if (!fs.existsSync(this.uploadsDir)) {
      fs.mkdirSync(this.uploadsDir, { recursive: true });
    }
  }

  private async saveBase64Image(base64String: string, filename: string): Promise<string> {
    const base64Data = base64String.replace(/^data:image\/\w+;base64,/, '');
    const buffer = Buffer.from(base64Data, 'base64');
    const filePath = path.join(this.uploadsDir, filename);
    fs.writeFileSync(filePath, buffer);
    return `/uploads/verification/${filename}`;
  }

  async findById(id: string) {
    const user = await this.userModel.findById(id).select('-password').lean();
    if (!user) {
      throw new NotFoundException('User not found');
    }
    return {
      ...user,
      id: (user as any)._id.toString(),
    };
  }

  async updateProfile(userId: string, dto: UpdateProfileDto) {
    const user = await this.userModel.findByIdAndUpdate(
      userId,
      {
        ...(dto.firstName && { firstName: dto.firstName }),
        ...(dto.lastName && { lastName: dto.lastName }),
        ...(dto.phone !== undefined && { phone: dto.phone }),
        ...(dto.dateOfBirth && { dateOfBirth: new Date(dto.dateOfBirth) }),
        ...(dto.address !== undefined && { address: dto.address }),
        ...(dto.city !== undefined && { city: dto.city }),
        ...(dto.country !== undefined && { country: dto.country }),
        ...(dto.postalCode !== undefined && { postalCode: dto.postalCode }),
      },
      { new: true },
    ).select('-password').lean();
    
    if (!user) {
      throw new NotFoundException('User not found');
    }
    return user;
  }

  async updateKycStatus(userId: string, dto: UpdateKycStatusDto) {
    const user = await this.userModel.findByIdAndUpdate(
      userId,
      { kycStatus: dto.kycStatus },
      { new: true },
    ).select('id email kycStatus').lean();
    
    if (!user) {
      throw new NotFoundException('User not found');
    }
    return user;
  }

  async findAll(page = 1, limit = 10, status?: UserStatus) {
    const skip = (page - 1) * limit;
    const query = status ? { status } : {};

    const [users, total] = await Promise.all([
      this.userModel
        .find(query)
        .select('id email firstName lastName kycStatus status createdAt')
        .skip(skip)
        .limit(limit)
        .sort({ createdAt: -1 })
        .lean(),
      this.userModel.countDocuments(query),
    ]);

    return {
      data: users,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async upgradeTier(userId: string, dto: UpgradeTierDto) {
    const user = await this.userModel.findById(userId);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    const currentTier = user.accountTier;
    const targetTier = dto.targetTier;

    // Validate tier progression (can only upgrade, not downgrade)
    const tierOrder = [AccountTier.TIER_1, AccountTier.TIER_2, AccountTier.TIER_3];
    const currentIndex = tierOrder.indexOf(currentTier);
    const targetIndex = tierOrder.indexOf(targetTier);

    if (targetIndex <= currentIndex) {
      throw new BadRequestException('You can only upgrade to a higher tier');
    }

    // Check requirements for target tier
    const requirements = TIER_REQUIREMENTS[targetTier];
    const missingRequirements: string[] = [];

    if (requirements.kycRequired && user.kycStatus !== KYCStatus.VERIFIED) {
      missingRequirements.push('KYC verification is required. Please complete your KYC information.');
    }

    if (requirements.addressVerificationRequired) {
      if (!user.address || !user.city || !user.country || !user.postalCode) {
        missingRequirements.push('Residential address confirmation is required. Please update your address information.');
      }
    }

    if (missingRequirements.length > 0) {
      throw new BadRequestException(missingRequirements.join(' '));
    }

    // Upgrade tier
    user.accountTier = targetTier;
    await user.save();

    return {
      id: user._id.toString(),
      email: user.email,
      accountTier: user.accountTier,
      message: `Successfully upgraded to ${targetTier}`,
    };
  }

  async getTierInfo(userId: string) {
    const user = await this.userModel.findById(userId).select('accountTier kycStatus address city country postalCode').lean();
    if (!user) {
      throw new NotFoundException('User not found');
    }

    const currentTier = user.accountTier;
    const tierOrder = [AccountTier.TIER_1, AccountTier.TIER_2, AccountTier.TIER_3];
    const currentIndex = tierOrder.indexOf(currentTier);

    // Get next tier if available
    const nextTier = currentIndex < tierOrder.length - 1 ? tierOrder[currentIndex + 1] : null;
    const nextTierRequirements = nextTier ? TIER_REQUIREMENTS[nextTier] : null;

    // Check if user meets requirements for next tier
    let canUpgrade = false;
    let missingRequirements: string[] = [];

    if (nextTier && nextTierRequirements) {
      const kycMet = !nextTierRequirements.kycRequired || user.kycStatus === KYCStatus.VERIFIED;
      const addressMet = !nextTierRequirements.addressVerificationRequired || 
        !!(user.address && user.city && user.country && user.postalCode);

      canUpgrade = kycMet && addressMet;

      if (!kycMet) {
        missingRequirements.push('KYC verification required');
      }
      if (!addressMet) {
        missingRequirements.push('Residential address confirmation required');
      }
    }

    return {
      currentTier,
      nextTier,
      canUpgrade,
      missingRequirements,
      requirements: nextTierRequirements,
    };
  }

  async createTransferPin(userId: string, dto: CreateTransferPinDto) {
    const user = await this.userModel.findById(userId);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (user.transferPin) {
      throw new BadRequestException('Transfer PIN already exists');
    }

    const hashedPin = await bcrypt.hash(dto.pin, 10);
    user.transferPin = hashedPin;
    await user.save();

    return { message: 'Transfer PIN created successfully' };
  }

  async verifyTransferPin(userId: string, dto: VerifyTransferPinDto) {
    const user = await this.userModel.findById(userId).select('transferPin');
    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (!user.transferPin) {
      throw new BadRequestException('Transfer PIN not set. Please create a transfer PIN first.');
    }

    const isPinValid = await bcrypt.compare(dto.pin, user.transferPin);
    if (!isPinValid) {
      throw new BadRequestException('Invalid transfer PIN');
    }

    return { message: 'Transfer PIN verified successfully' };
  }

  async hasTransferPin(userId: string) {
    const user = await this.userModel.findById(userId).select('transferPin').lean();
    if (!user) {
      throw new NotFoundException('User not found');
    }
    return { hasTransferPin: !!user.transferPin };
  }

  async updateTransferPin(userId: string, dto: UpdateTransferPinDto) {
    const user = await this.userModel.findById(userId);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (!user.transferPin) {
      throw new BadRequestException('Transfer PIN not set. Please create a transfer PIN first.');
    }

    // Verify current PIN
    const isCurrentPinValid = await bcrypt.compare(dto.currentPin, user.transferPin);
    if (!isCurrentPinValid) {
      throw new BadRequestException('Current transfer PIN is incorrect');
    }

    // Check if new PIN is different from current PIN
    const isSamePin = await bcrypt.compare(dto.newPin, user.transferPin);
    if (isSamePin) {
      throw new BadRequestException('New PIN must be different from current PIN');
    }

    // Hash and update new PIN
    const hashedNewPin = await bcrypt.hash(dto.newPin, 10);
    user.transferPin = hashedNewPin;
    await user.save();

    return { message: 'Transfer PIN updated successfully' };
  }

  async upgradeToTier2(userId: string, dto: UpgradeToTier2Dto) {
    const user = await this.userModel.findById(userId);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Validate current tier
    if (user.accountTier !== AccountTier.TIER_1) {
      throw new BadRequestException('You can only upgrade from Tier 1 to Tier 2');
    }

    // Check if there's already a pending or approved verification
    const existingVerification = await this.verificationDocumentModel.findOne({
      userId,
      verificationType: VerificationType.IDENTITY,
      status: { $in: [VerificationStatus.PENDING, VerificationStatus.APPROVED] },
    });

    if (existingVerification) {
      throw new BadRequestException('A verification request already exists for Tier 2 upgrade');
    }

    // Validate document type for Tier 2
    const validTier2Types = [DocumentType.NATIONAL_ID, DocumentType.DRIVERS_LICENSE, DocumentType.PASSPORT];
    if (!validTier2Types.includes(dto.documentType)) {
      throw new BadRequestException('Invalid document type for Tier 2 verification');
    }

    // Save images
    const timestamp = Date.now();
    const frontImageFilename = `${userId}_tier2_front_${timestamp}.jpg`;
    const backImageFilename = `${userId}_tier2_back_${timestamp}.jpg`;

    const frontImageUrl = await this.saveBase64Image(dto.frontImage, frontImageFilename);
    let backImageUrl: string | undefined;

    if (dto.backImage) {
      backImageUrl = await this.saveBase64Image(dto.backImage, backImageFilename);
    } else if (dto.documentType === DocumentType.PASSPORT) {
      // Passport doesn't need back image
    } else {
      throw new BadRequestException('Back image is required for National ID and Driver\'s License');
    }

    // Create verification document
    const verificationDoc = new this.verificationDocumentModel({
      userId,
      verificationType: VerificationType.IDENTITY,
      documentType: dto.documentType,
      identityNumber: dto.identityNumber,
      frontImageUrl,
      backImageUrl,
      status: VerificationStatus.PENDING,
    });

    await verificationDoc.save();

    return {
      message: 'Tier 2 upgrade request submitted successfully. Please wait for admin verification.',
      verificationId: verificationDoc._id.toString(),
    };
  }

  async upgradeToTier3(userId: string, dto: UpgradeToTier3Dto) {
    const user = await this.userModel.findById(userId);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Validate current tier
    if (user.accountTier !== AccountTier.TIER_2) {
      throw new BadRequestException('You must be on Tier 2 to upgrade to Tier 3');
    }

    // Check if KYC is verified (required for Tier 3)
    if (user.kycStatus !== KYCStatus.VERIFIED) {
      throw new BadRequestException('KYC verification is required before upgrading to Tier 3');
    }

    // Check if there's already a pending or approved verification
    const existingVerification = await this.verificationDocumentModel.findOne({
      userId,
      verificationType: VerificationType.ADDRESS,
      status: { $in: [VerificationStatus.PENDING, VerificationStatus.APPROVED] },
    });

    if (existingVerification) {
      throw new BadRequestException('A verification request already exists for Tier 3 upgrade');
    }

    // Validate document type for Tier 3
    const validTier3Types = [DocumentType.UTILITY_BILL, DocumentType.BANK_STATEMENT, DocumentType.GOVERNMENT_LETTER];
    if (!validTier3Types.includes(dto.documentType)) {
      throw new BadRequestException('Invalid document type for Tier 3 verification');
    }

    // Update user address information
    user.address = dto.address;
    user.city = dto.city;
    user.country = dto.country;
    user.postalCode = dto.postalCode;
    await user.save();

    // Save document image
    const timestamp = Date.now();
    const documentImageFilename = `${userId}_tier3_address_${timestamp}.jpg`;
    const documentImageUrl = await this.saveBase64Image(dto.documentImage, documentImageFilename);

    // Create verification document
    const verificationDoc = new this.verificationDocumentModel({
      userId,
      verificationType: VerificationType.ADDRESS,
      documentType: dto.documentType,
      address: dto.address,
      city: dto.city,
      country: dto.country,
      postalCode: dto.postalCode,
      frontImageUrl: documentImageUrl,
      status: VerificationStatus.PENDING,
    });

    await verificationDoc.save();

    return {
      message: 'Tier 3 upgrade request submitted successfully. Please wait for admin verification.',
      verificationId: verificationDoc._id.toString(),
    };
  }

  async getVerificationStatus(userId: string) {
    const identityVerification = await this.verificationDocumentModel
      .findOne({ userId, verificationType: VerificationType.IDENTITY })
      .sort({ createdAt: -1 })
      .lean();

    const addressVerification = await this.verificationDocumentModel
      .findOne({ userId, verificationType: VerificationType.ADDRESS })
      .sort({ createdAt: -1 })
      .lean();

    return {
      identityVerification: identityVerification || null,
      addressVerification: addressVerification || null,
    };
  }

  async getAllVerificationRequests(page = 1, limit = 20, status?: VerificationStatus) {
    const skip = (page - 1) * limit;
    const query = status ? { status } : {};

    const [verifications, total] = await Promise.all([
      this.verificationDocumentModel
        .find(query)
        .populate('userId', 'email firstName lastName accountTier')
        .populate('reviewedBy', 'email firstName lastName')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      this.verificationDocumentModel.countDocuments(query),
    ]);

    return {
      data: verifications,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async updateVerificationStatus(adminId: string, verificationId: string, dto: UpdateVerificationStatusDto) {
    const verification = await this.verificationDocumentModel.findById(verificationId);
    if (!verification) {
      throw new NotFoundException('Verification document not found');
    }

    if (verification.status !== VerificationStatus.PENDING) {
      throw new BadRequestException('Verification has already been processed');
    }

    // Update verification status
    verification.status = dto.status;
    verification.reviewedBy = adminId as any;
    verification.reviewedAt = new Date();
    if (dto.rejectionReason) {
      verification.rejectionReason = dto.rejectionReason;
    }
    if (dto.notes) {
      verification.notes = dto.notes;
    }

    await verification.save();

    // If approved, upgrade user tier
    if (dto.status === VerificationStatus.APPROVED) {
      const user = await this.userModel.findById(verification.userId);
      if (user) {
        if (verification.verificationType === VerificationType.IDENTITY) {
          // Approve KYC and upgrade to Tier 2
          user.kycStatus = KYCStatus.VERIFIED;
          user.accountTier = AccountTier.TIER_2;
        } else if (verification.verificationType === VerificationType.ADDRESS) {
          // Upgrade to Tier 3
          user.accountTier = AccountTier.TIER_3;
        }
        await user.save();
      }
    }

    return {
      message: `Verification ${dto.status.toLowerCase()} successfully`,
      verification: await this.verificationDocumentModel
        .findById(verificationId)
        .populate('userId', 'email firstName lastName accountTier')
        .lean(),
    };
  }
}

