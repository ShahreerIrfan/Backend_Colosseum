import type { Response } from 'express';

export default class ResponseHandler {
  static send(
    res: Response,
    statusCode: number,
    resBody: {
      data?: any | null;
      message?: string | null;
      stack?: any | null;
    }
  ) {
    const success = statusCode < 400;
    const response: any = {
      success,
      ...(resBody.data !== undefined && { payload: resBody.data, data: resBody.data }),
      ...(resBody.message && { message: resBody.message }),
      ...(resBody.stack && { stack: resBody.stack }),
    };

    res.status(statusCode).json(response);
  }
}
