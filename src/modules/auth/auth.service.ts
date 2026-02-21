import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { OAuth2Client } from 'google-auth-library';
import prisma from '../../config/database';
import { ApiError } from '../../utils/apiError';
import { RegisterInput, LoginInput, UpdateProfileInput, GoogleAuthInput, GitHubAuthInput } from './auth.schema';
import { AuthPayload } from '../../middleware/auth';
import { EmailService } from '../../utils/emailService';

const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

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

    // Send welcome email (fire and forget)
    EmailService.sendWelcome(user.email, user.firstName).catch(() => {});

    return { user, ...tokens };
  }

  static async login(input: LoginInput) {
    const user = await prisma.user.findUnique({
      where: { email: input.email },
    });

    if (!user) {
      throw ApiError.unauthorized('Invalid email or password');
    }

    if (!user.password) {
      const providerName = user.provider === 'google' ? 'Google' : user.provider === 'github' ? 'GitHub' : 'social';
      throw ApiError.unauthorized(`This account uses ${providerName} sign-in. Please use the ${providerName} button to log in.`);
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
        provider: true,
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

  static async googleLogin(input: GoogleAuthInput) {
    let googleId: string;
    let email: string;
    let given_name: string | undefined;
    let family_name: string | undefined;
    let picture: string | undefined;

    // Try as ID token first, then as access token
    try {
      const ticket = await googleClient.verifyIdToken({
        idToken: input.credential,
        audience: process.env.GOOGLE_CLIENT_ID,
      });
      const payload = ticket.getPayload();
      if (!payload || !payload.email) throw new Error('No payload');
      googleId = payload.sub;
      email = payload.email;
      given_name = payload.given_name;
      family_name = payload.family_name;
      picture = payload.picture;
    } catch {
      // Credential might be an access token from implicit flow — call userinfo
      try {
        const res = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
          headers: { Authorization: `Bearer ${input.credential}` },
        });
        if (!res.ok) throw new Error('userinfo failed');
        const info = await res.json() as { sub: string; email?: string; given_name?: string; family_name?: string; picture?: string };
        if (!info.email) throw new Error('No email');
        googleId = info.sub;
        email = info.email;
        given_name = info.given_name;
        family_name = info.family_name;
        picture = info.picture;
      } catch {
        throw ApiError.unauthorized('Invalid Google credential');
      }
    }

    // Try to find existing user by googleId or email
    let user = await prisma.user.findFirst({
      where: { OR: [{ googleId }, { email }] },
    });

    if (user) {
      // Link Google account if found by email but not yet linked
      if (!user.googleId) {
        user = await prisma.user.update({
          where: { id: user.id },
          data: { googleId, provider: user.provider === 'local' ? 'google' : user.provider },
        });
      }
    } else {
      // New user — role is required
      if (!input.role) {
        throw ApiError.badRequest('Role is required for new accounts. Please sign up first.');
      }

      user = await prisma.user.create({
        data: {
          email,
          googleId,
          provider: 'google',
          firstName: given_name || 'User',
          lastName: family_name || '',
          role: input.role,
          profileImage: picture || null,
        },
      });

      // Send welcome email (fire and forget)
      EmailService.sendWelcome(user.email, user.firstName).catch(() => {});
    }

    const tokens = this.generateTokens({
      userId: user.id,
      email: user.email,
      role: user.role,
    });

    const { password: _, ...userWithoutPassword } = user;
    return { user: userWithoutPassword, ...tokens };
  }

  static async githubLogin(input: GitHubAuthInput) {
    let accessToken: string;

    if (input.accessToken) {
      // Retry with saved access token (after role selection)
      accessToken = input.accessToken;
    } else if (input.code) {
      // Exchange code for access token
      const tokenResponse = await fetch('https://github.com/login/oauth/access_token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify({
          client_id: process.env.GITHUB_CLIENT_ID,
          client_secret: process.env.GITHUB_CLIENT_SECRET,
          code: input.code,
        }),
      });

      const tokenData = await tokenResponse.json() as { error?: string; access_token?: string };
      if (tokenData.error || !tokenData.access_token) {
        throw ApiError.unauthorized('Failed to authenticate with GitHub');
      }

      accessToken = tokenData.access_token;
    } else {
      throw ApiError.badRequest('Either code or accessToken is required');
    }

    // Fetch user profile
    const profileResponse = await fetch('https://api.github.com/user', {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    const profile = await profileResponse.json() as { id?: number; email?: string; name?: string; login?: string; avatar_url?: string };

    if (!profile.id) {
      throw ApiError.unauthorized('Failed to fetch GitHub profile');
    }

    // Get email — may be private
    let email = profile.email;
    if (!email) {
      const emailsResponse = await fetch('https://api.github.com/user/emails', {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      const emails = await emailsResponse.json() as Array<{ email: string; primary: boolean; verified: boolean }>;
      const primary = emails.find((e) => e.primary && e.verified);
      email = primary?.email;
    }

    if (!email) {
      throw ApiError.badRequest('Could not retrieve email from GitHub. Please ensure your GitHub email is verified.');
    }

    const githubId = String(profile.id);

    // Try to find existing user by githubId or email
    let user = await prisma.user.findFirst({
      where: { OR: [{ githubId }, { email }] },
    });

    if (user) {
      // Link GitHub account if found by email but not yet linked
      if (!user.githubId) {
        user = await prisma.user.update({
          where: { id: user.id },
          data: { githubId, provider: user.provider === 'local' ? 'github' : user.provider },
        });
      }
    } else {
      // New user — role is required
      if (!input.role) {
        // Return the access token so frontend can retry with role selection
        return { needsRole: true, githubAccessToken: accessToken } as any;
      }

      const nameParts = (profile.name || profile.login || '').split(' ');
      user = await prisma.user.create({
        data: {
          email,
          githubId,
          provider: 'github',
          firstName: nameParts[0] || 'User',
          lastName: nameParts.slice(1).join(' ') || '',
          role: input.role,
          profileImage: profile.avatar_url || null,
        },
      });

      // Send welcome email (fire and forget)
      EmailService.sendWelcome(user.email, user.firstName).catch(() => {});
    }

    const tokens = this.generateTokens({
      userId: user.id,
      email: user.email,
      role: user.role,
    });

    const { password: _, ...userWithoutPassword } = user;
    return { user: userWithoutPassword, ...tokens };
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
