import {
  Controller,
  Post,
  Body,
  Route,
  Tags,
  Response,
  Security,
  Request,
} from 'tsoa';
import jwt from 'jsonwebtoken';
import { User, UserDocument } from '../models/userModel';
import { AuthenticatedRequest } from '../middlewares/authMiddleware';
import {
  BadRequestError,
  UnauthorizedError,
  NotFoundError,
} from '@/util/errorTypes';
import { env } from '../config/env';

interface RegisterRequest {
  name: string;
  email: string;
  password: string;
}

interface LoginRequest {
  email: string;
  password: string;
}

interface AuthResponse {
  token: string;
  user: {
    id: string;
    name: string;
    email: string;
    profilePicture?: string;
    about?: string;
  };
}

@Route('auth')
@Tags('Authentication')
export class AuthController extends Controller {
  /**
   * Register a new user
   */
  @Post('register')
  @Response(201, 'User registered successfully')
  @Response(400, 'Bad request')
  @Response(409, 'Email already in use')
  public async register(
    @Body() requestBody: RegisterRequest,
  ): Promise<AuthResponse> {
    const { name, email, password } = requestBody;

    if (!name || !email || !password) {
      throw new BadRequestError('Name, email, and password are required');
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      throw new BadRequestError('Email already in use');
    }

    // Create new user
    const user = new User({
      name,
      email,
      password,
    }) as UserDocument;

    await user.save();

    // Generate JWT token
    const token = jwt.sign(
      { _id: user._id.toHexString(), email: user.email, role: user.role },
      env.JWT_SECRET || 'secret88',
      { expiresIn: '24h' } as jwt.SignOptions,
    );

    return {
      token,
      user: {
        id: user._id.toHexString(),
        name: user.name,
        email: user.email,
        profilePicture: user.profilePicture,
        about: user.about,
      },
    };
  }

  /**
   * Login a user
   */
  @Post('login')
  @Response(200, 'Login successful')
  @Response(400, 'Bad request')
  @Response(401, 'Invalid credentials')
  public async login(@Body() requestBody: LoginRequest): Promise<AuthResponse> {
    const { email, password } = requestBody;

    if (!email || !password) {
      throw new BadRequestError('Email and password are required');
    }

    // Find user by email
    const user = (await User.findOne({ email })) as UserDocument;
    if (!user) {
      throw new UnauthorizedError('Invalid credentials');
    }

    // Check password
    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      throw new UnauthorizedError('Invalid credentials');
    }

    // Update user status
    user.isOnline = true;
    user.lastSeen = new Date();
    await user.save();
    const jwtSecret = env.JWT_SECRET;

    // Generate JWT token
    const token = jwt.sign(
      { _id: user._id.toHexString(), email: user.email, role: user.role },
      jwtSecret,
      { expiresIn: '24h' } as jwt.SignOptions,
    );

    return {
      token,
      user: {
        id: user._id.toHexString(),
        name: user.name,
        email: user.email,
        profilePicture: user.profilePicture,
        about: user.about,
      },
    };
  }

  /**
   * Logout a user
   */
  @Security('jwt')
  @Post('logout')
  @Response(200, 'Logout successful')
  @Response(401, 'Unauthorized')
  public async logout(
    @Request() request: AuthenticatedRequest,
  ): Promise<{ message: string }> {
    const userId = request.user?._id;
    console.info(request.user);
    if (!userId) {
      throw new UnauthorizedError('User not authenticated');
    }

    // Update user status
    const user = (await User.findByIdAndUpdate(
      userId,
      {
        isOnline: false,
        lastSeen: new Date(),
      },
      { new: true },
    )) as UserDocument;

    if (!user) {
      throw new NotFoundError('User not found');
    }

    return {
      message: 'Logout successful',
    };
  }
}
