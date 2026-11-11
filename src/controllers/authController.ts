import type { Request, Response } from 'express';
import AuthService from '@services/authService.js';
import ResponseHandler from '@utils/responseHandler.js';
import { HttpConstants, MessageConstants, EnvConstant } from '@constants/allConstant.js';

const HttpStatus = HttpConstants.statusCode;
const Message = MessageConstants.responseMessage.authController;

export default class AuthController {
  private authService: AuthService;

  constructor() {
    this.authService = new AuthService();
  }

  SignUp = async (req: Request, res: Response): Promise<void> => {
    const data = req.validatedBody;
    const result = await this.authService.SignUp(data);

    this.setAuthCookie(res, result.token);
    ResponseHandler.send(res, HttpStatus.CREATED.code, {
      data: result,
      message: Message.signUpSuccessful,
    });
  };

  SignIn = async (req: Request, res: Response): Promise<void> => {
    const data = req.validatedBody;
    const result = await this.authService.SignIn(data);

    this.setAuthCookie(res, result.token);
    ResponseHandler.send(res, HttpStatus.OK.code, {
      data: result,
      message: Message.signInSuccessful,
    });
  };

  Logout = async (_req: Request, res: Response): Promise<void> => {
    res.clearCookie('authToken', {
      httpOnly: true,
      secure: EnvConstant.NODE_ENV === 'production',
      sameSite: 'lax',
    });
    ResponseHandler.send(res, HttpStatus.OK.code, {
      message: Message.logoutSuccessful,
    });
  };

  GetProfile = async (req: Request, res: Response): Promise<void> => {
    const userId = req.user!.id;
    const profile = await this.authService.GetProfile(userId);
    ResponseHandler.send(res, HttpStatus.OK.code, {
      data: profile,
      message: Message.profileRetrieved,
    });
  };

  ChangePassword = async (req: Request, res: Response): Promise<void> => {
    const userId = req.user!.id;
    const data = req.validatedBody;
    await this.authService.ChangePassword(userId, data);
    ResponseHandler.send(res, HttpStatus.OK.code, {
      message: Message.passwordChangeSuccessful,
    });
  };

  GetAllUsers = async (req: Request, res: Response): Promise<void> => {
    const query = req.validatedQuery || {};
    const result = await this.authService.GetAllUsers(query);
    ResponseHandler.send(res, HttpStatus.OK.code, {
      data: result,
    });
  };

  CreateUser = async (req: Request, res: Response): Promise<void> => {
    const user = await this.authService.CreateUser(req.user!, req.validatedBody);
    ResponseHandler.send(res, HttpStatus.CREATED.code, { data: user });
  };

  UpdateUserRole = async (req: Request, res: Response): Promise<void> => {
    const id = req.validatedParams.id;
    const { role } = req.validatedBody;
    const updated = await this.authService.UpdateUserDetails(req.user!, id, { role });
    ResponseHandler.send(res, HttpStatus.OK.code, {
      data: updated,
      message: 'User role updated successfully',
    });
  };

  UpdateUserDetails = async (req: Request, res: Response): Promise<void> => {
    const id = req.validatedParams.id;
    const data = req.validatedBody;
    const updated = await this.authService.UpdateUserDetails(req.user!, id, data);
    ResponseHandler.send(res, HttpStatus.OK.code, {
      data: updated,
      message: 'User details updated successfully',
    });
  };

  RemoveUser = async (req: Request, res: Response): Promise<void> => {
    const id = req.validatedParams.id;
    await this.authService.RemoveUser(req.user!, id);
    ResponseHandler.send(res, HttpStatus.OK.code, {
      message: 'User removed successfully',
    });
  };

  private setAuthCookie(res: Response, token: string): void {
    res.cookie('authToken', token, {
      httpOnly: true,
      secure: EnvConstant.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });
  }
}
