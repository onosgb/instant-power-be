import { HttpException } from '@nestjs/common';
import { Prisma } from 'prisma';
export const ERROR_MESSAGES = {
  INVALID_CREDENTIALS: 'Invalid Credentials!',
  ACCOUNT_NOT_ACTIVE: 'Please check your mail and verify your account!',
  INVALID_VERIFICATION_CODE: 'Invalid Verification code!',
};
export class AuthenticationError extends HttpException {
  constructor(message: string, status: number) {
    super(message, status);
  }
}

export const ThrowBadRequest = (error: any) => {
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    let message = 'A database error occurred';

    switch (error.code) {
      case 'P2002': // Unique constraint violation
        message = 'Duplicate entry detected. Please use a unique value.';
        break;
      case 'P2003': // Foreign key constraint failure
        message = 'Invalid reference. The related record does not exist.';
        break;
      case 'P2025': // Record not found
        message = 'The requested record does not exist.';
        break;
      default:
        message = error.message; // Use Prisma's message for unknown errors
    }
    throw new HttpException(message, 400);
  } else if (error instanceof HttpException) {
    // Handle errors explicitly thrown by your own code
    throw error;
  } else {
    // Handle unexpected errors
    throw new HttpException('An unexpected error occurred', 500);
  }
};
