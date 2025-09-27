import { NextRequest } from 'next/server';
import bcrypt from 'bcryptjs';
import { Role } from '@prisma/client';
import { createTokenResponse } from '@/lib/auth/jwt';
import { executeWithErrorHandling } from '@/lib/db';

interface LoginRequest {
  email: string;
  password: string;
}

//POST /api/auth/login ; return jwt
export async function POST(request: NextRequest) {
  try {
    const body: LoginRequest = await request.json();
    
    // Validation
    if (!body.email || !body.password) {
      return Response.json(
        {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Email and password are required',
            details: {
              missing_fields: [
                ...(body.email ? [] : ['email']),
                ...(body.password ? [] : ['password'])
              ]
            }
          }
        },
        { status: 400 }
      );
    }
    
    // and more validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(body.email)) {
      return Response.json(
        {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid email format',
            details: {
              field: 'email',
              received: body.email,
              expected: 'Valid email address'
            }
          }
        },
        { status: 400 }
      );
    }
    
    // Find user by email using Prisma
    interface UserSelect {
      id: string;
      email: string;
      passwordHash: string;
      role: Role;
      firstName: string | null;
      lastName: string | null;
      phone: string | null;
      createdAt: Date;
      updatedAt: Date;
    }

    const user: UserSelect | null = await executeWithErrorHandling(async (prisma): Promise<UserSelect | null> => {
      return await prisma.user.findUnique({
        where: {
          email: body.email.toLowerCase().trim()
        },
        select: {
          id: true,
          email: true,
          passwordHash: true,
          role: true,
          firstName: true,
          lastName: true,
          phone: true,
          createdAt: true,
          updatedAt: true
        }
      });
    });
    
    if (!user) {
      return Response.json(
        {
          success: false,
          error: {
            code: 'INVALID_CREDENTIALS',
            message: 'Invalid email or password'
          }
        },
        { status: 401 }
      );
    }
    
    // Verify password using bcrypt
    // bcrypt.compare() compares plain text with the hashed version
    const isValidPassword = await bcrypt.compare(body.password, user.passwordHash);
    
    if (!isValidPassword) {
      return Response.json(
        {
          success: false,
          error: {
            code: 'INVALID_CREDENTIALS',
            message: 'Invalid email or password'
          }
        },
        { status: 401 }
      );
    }
    
    // Create token response with user information (excluding password hash)
    const { passwordHash, ...userWithoutPassword } = user;
    const tokenResponse = createTokenResponse(userWithoutPassword);
    
    return Response.json({
      success: true,
      data: tokenResponse
    });
    
  } catch (error) {
    console.error('Login error:', error);
    
    // database errors
    if (error instanceof Error) {
      if (error.message === 'DATABASE_CONNECTION_ERROR') {
        return Response.json(
          {
            success: false,
            error: {
              code: 'DATABASE_ERROR',
              message: 'Database connection failed',
              details: {
                error_id: `db_err_${Date.now()}`,
                retry_after: 5
              }
            }
          },
          { status: 500 }
        );
      }
    }
    
    return Response.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'An unexpected error occurred',
          details: {
            error_id: `err_${Date.now()}`,
            timestamp: new Date().toISOString()
          }
        }
      },
      { status: 500 }
    );
  }
}