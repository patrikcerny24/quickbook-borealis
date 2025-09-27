import { NextRequest } from 'next/server';
import bcrypt from 'bcryptjs';
import { Role } from '@prisma/client';
import { createTokenResponse } from '@/lib/auth/jwt';
import { executeWithErrorHandling } from '@/lib/db';

// Define the expected request body structure
interface RegisterRequest {
  email: string;
  password: string;
  role: string; // Will be converted to Prisma Role enum
  first_name: string;
  last_name: string;
  phone?: string;
}

/**
 * POST /api/auth/register
 * Creates a new user account and returns JWT token
 */
export async function POST(request: NextRequest) {
  try {
    // Parse JSON body from request
    const body: RegisterRequest = await request.json();
    
    // Validate required fields
    const requiredFields = ['email', 'password', 'role', 'first_name', 'last_name'];
    const missingFields = requiredFields.filter(field => !body[field as keyof RegisterRequest]);
    
    if (missingFields.length > 0) {
      return Response.json(
        {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Missing required fields',
            details: {
              missing_fields: missingFields,
              provided_fields: Object.keys(body).filter(key => body[key as keyof RegisterRequest])
            }
          }
        },
        { status: 400 }
      );
    }
    
    // Validate email format
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
    
    // Validate password strength (minimum 6 characters for MVP)
    if (body.password.length < 6) {
      return Response.json(
        {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Password must be at least 6 characters long',
            details: {
              field: 'password',
              min_length: 6,
              received_length: body.password.length
            }
          }
        },
        { status: 400 }
      );
    }
    
    // Validate role and convert to Prisma enum
    const roleMap: { [key: string]: Role } = {
      'customer': 'CUSTOMER',
      'provider': 'PROVIDER', 
      'admin': 'ADMIN'
    };
    
    const normalizedRole = body.role.toLowerCase();
    const prismaRole = roleMap[normalizedRole];
    
    if (!prismaRole) {
      return Response.json(
        {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid role specified',
            details: {
              field: 'role',
              received: body.role,
              allowed_values: ['customer', 'provider', 'admin']
            }
          }
        },
        { status: 400 }
      );
    }
    
    // Validate name fields (basic check for non-empty strings)
    if (body.first_name.trim().length === 0 || body.last_name.trim().length === 0) {
      return Response.json(
        {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'First name and last name cannot be empty',
            details: {
              first_name_valid: body.first_name.trim().length > 0,
              last_name_valid: body.last_name.trim().length > 0
            }
          }
        },
        { status: 400 }
      );
    }
    
    // Hash using bcrypt
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(body.password, saltRounds);
    
    const newUser = await executeWithErrorHandling(async (prisma) => {
      return await prisma.user.create({
        data: {
          email: body.email.toLowerCase().trim(),
          passwordHash: hashedPassword,
          role: prismaRole,
          firstName: body.first_name.trim(),
          lastName: body.last_name.trim(),
          phone: body.phone?.trim() || null
        },
        select: {
          id: true,
          email: true,
          role: true,
          firstName: true,
          lastName: true,
          phone: true,
          createdAt: true,
          updatedAt: true
        }
      });
    });
    
    // Create token response for new user
    const tokenResponse = createTokenResponse(newUser);
    
    return Response.json({
      success: true,
      data: tokenResponse
    }, { status: 201 }); 
    
  } catch (error) {
    console.error('Registration error:', error);
    
   
    if (error instanceof Error) {
      if (error.message === 'DUPLICATE_EMAIL') {
        return Response.json(
          {
            success: false,
            error: {
              code: 'DUPLICATE_EMAIL',
              message: 'An account with this email address already exists',
              details: {}
            }
          },
          { status: 409 }
        );
      }
      
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
          message: 'An unexpected error occurred during registration',
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