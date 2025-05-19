import { Controller, Get, Put, Route, Tags, Security, Request, Body, Path, Response } from 'tsoa';
import { AuthenticatedRequest } from '../middlewares/authMiddleware';
import { User } from '../models/userModel';
import { NotFoundError, UnauthorizedError } from '@/util/errorTypes';

interface UserProfileResponse {
  id: string;
  name: string;
  email: string;
  profilePicture?: string;
  about?: string;
  lastSeen: Date;
  isOnline: boolean;
}

interface UpdateProfileRequest {
  name?: string;
  about?: string;
  profilePicture?: string;
}

@Route('users')
@Tags('Users')
export class UserController extends Controller {
  /**
   * Get the current user's profile
   */
  @Security('jwt')
  @Get('me')
  @Response(200, 'Success')
  @Response(401, 'Unauthorized')
  public async getCurrentUser(
    @Request() request: AuthenticatedRequest
  ): Promise<UserProfileResponse> {
    const userId = request.user?._id;

    if (!userId) {
      throw new UnauthorizedError('User not authenticated');
    }

    const user = await User.findById(userId);

    if (!user) {
      throw new NotFoundError('User not found');
    }

    return {
      id: user._id.toString(),
      name: user.name,
      email: user.email,
      profilePicture: user.profilePicture,
      about: user.about,
      lastSeen: user.lastSeen,
      isOnline: user.isOnline
    };
  }

  /**
   * Update the current user's profile
   */
  @Security('jwt')
  @Put('me')
  @Response(200, 'Profile updated successfully')
  @Response(401, 'Unauthorized')
  public async updateProfile(
    @Request() request: AuthenticatedRequest,
    @Body() requestBody: UpdateProfileRequest
  ): Promise<UserProfileResponse> {
    const userId = request.user?._id;

    if (!userId) {
      throw new UnauthorizedError('User not authenticated');
    }

    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { $set: requestBody },
      { new: true }
    );

    if (!updatedUser) {
      throw new NotFoundError('User not found');
    }

    return {
      id: updatedUser._id.toString(),
      name: updatedUser.name,
      email: updatedUser.email,
      profilePicture: updatedUser.profilePicture,
      about: updatedUser.about,
      lastSeen: updatedUser.lastSeen,
      isOnline: updatedUser.isOnline
    };
  }

  /**
   * Get user by ID
   */
  @Security('jwt')
  @Get('{userId}')
  @Response(200, 'Success')
  @Response(401, 'Unauthorized')
  @Response(404, 'User not found')
  public async getUserById(
    @Path() userId: string
  ): Promise<UserProfileResponse> {
    const user = await User.findById(userId);

    if (!user) {
      throw new NotFoundError('User not found');
    }

    return {
      id: user._id.toString(),
      name: user.name,
      email: user.email,
      profilePicture: user.profilePicture,
      about: user.about,
      lastSeen: user.lastSeen,
      isOnline: user.isOnline
    };
  }

  /**
   * Search users by name or email
   */
  @Security('jwt')
  @Get('search/{query}')
  @Response(200, 'Success')
  @Response(401, 'Unauthorized')
  public async searchUsers(
    @Request() request: AuthenticatedRequest,
    @Path() query: string
  ): Promise<UserProfileResponse[]> {
    const userId = request.user?._id;

    if (!userId) {
      throw new UnauthorizedError('User not authenticated');
    }

    const users = await User.find({
      $and: [
        { _id: { $ne: userId } },
        {
          $or: [
            { name: { $regex: query, $options: 'i' } },
            { email: { $regex: query, $options: 'i' } }
          ]
        }
      ]
    }).limit(20);

    return users.map(user => ({
      id: user._id.toString(),
      name: user.name,
      email: user.email,
      profilePicture: user.profilePicture,
      about: user.about,
      lastSeen: user.lastSeen,
      isOnline: user.isOnline
    }));
  }
}
