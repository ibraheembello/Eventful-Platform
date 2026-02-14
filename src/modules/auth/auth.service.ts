import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import prisma from '../../config/database';
import { ApiError } from '../../utils/apiError';
import { RegisterInput, LoginInput, UpdateProfileInput } from './auth.schema';
import { AuthPayload } from '../../middleware/auth';

export class AuthService {
  static async register(input: RegisterInput) {
    const existingUser = await prisma.user.findUnique({
      where: { email: input.email },
    });

    if (existingUser) {
      throw ApiError.conflict('User with this email already exists');
    }

    const hashedPassword = await bcrypt.hash(input.password, 12);

    const user = await prisma.user.create({
      data: {
        email: input.email,
        password: hashedPassword,
        firstName: input.firstName,
        lastName: input.lastName,
        role: input.role,
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        profileImage: true,
        createdAt: true,
      },
    });

    const tokens = this.generateTokens({
      userId: user.id,
      email: user.email,
      role: user.role,
    });

    return { user, ...tokens };
  }

  static async login(input: LoginInput) {
    const user = await prisma.user.findUnique({
      where: { email: input.email },
    });

    if (!user) {
      throw ApiError.unauthorized('Invalid email or password');
    }

    const isPasswordValid = await bcrypt.compare(input.password, user.password);

    if (!isPasswordValid) {
      throw ApiError.unauthorized('Invalid email or password');
    }

    const tokens = this.generateTokens({
      userId: user.id,
      email: user.email,
      role: user.role,
    });

    const { password: _, ...userWithoutPassword } = user;

    return { user: userWithoutPassword, ...tokens };
  }

  static async getProfile(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        profileImage: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!user) {
      throw ApiError.notFound('User not found');
    }

    return user;
  }

  static async updateProfile(userId: string, input: UpdateProfileInput) {
    const user = await prisma.user.update({
      where: { id: userId },
      data: {
        ...(input.firstName && { firstName: input.firstName }),
        ...(input.lastName && { lastName: input.lastName }),
        ...(input.profileImage !== undefined && { profileImage: input.profileImage }),
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        profileImage: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return user;
  }

  static async refreshToken(refreshToken: string) {
    try {
      const decoded = jwt.verify(
        refreshToken,
        process.env.JWT_REFRESH_SECRET || 'refresh-secret'
      ) as AuthPayload;

      const user = await prisma.user.findUnique({
        where: { id: decoded.userId },
      });

      if (!user) {
        throw ApiError.unauthorized('User not found');
      }

      const tokens = this.generateTokens({
        userId: user.id,
        email: user.email,
        role: user.role,
      });

      return tokens;
    } catch {
      throw ApiError.unauthorized('Invalid or expired refresh token');
    }
  }

  // jwt.sign expiresIn expects number (seconds) or a StringValue, not a plain string.
  // We use numeric seconds to avoid the type mismatch with env vars returning string.
  private static generateTokens(payload: AuthPayload) {
    const accessToken = jwt.sign(payload, process.env.JWT_ACCESS_SECRET || 'secret', {
      expiresIn: 900, // 15 minutes in seconds
    } as jwt.SignOptions);

    const refreshToken = jwt.sign(payload, process.env.JWT_REFRESH_SECRET || 'refresh-secret', {
      expiresIn: 604800, // 7 days in seconds
    } as jwt.SignOptions);

    return { accessToken, refreshToken };
  }
}
