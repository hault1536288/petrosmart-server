import {
  ValidatorConstraint,
  ValidatorConstraintInterface,
  ValidationArguments,
  registerDecorator,
  ValidationOptions,
} from 'class-validator';

@ValidatorConstraint({ name: 'isStrongPassword', async: false })
export class IsStrongPasswordConstraint
  implements ValidatorConstraintInterface
{
  validate(password: string, args: ValidationArguments) {
    if (!password || typeof password !== 'string') {
      return false;
    }

    // At least 8 characters
    if (password.length < 8) {
      return false;
    }

    // At least one uppercase letter
    if (!/[A-Z]/.test(password)) {
      return false;
    }

    // At least one lowercase letter
    if (!/[a-z]/.test(password)) {
      return false;
    }

    // At least one number
    if (!/[0-9]/.test(password)) {
      return false;
    }

    // At least one special character
    if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
      return false;
    }

    // No common patterns
    const commonPatterns = [
      'password',
      '12345678',
      'qwerty',
      'abc123',
      'letmein',
      'admin',
    ];

    const lowerPassword = password.toLowerCase();
    for (const pattern of commonPatterns) {
      if (lowerPassword.includes(pattern)) {
        return false;
      }
    }

    return true;
  }

  defaultMessage(args: ValidationArguments) {
    return 'Password must be at least 8 characters long and contain at least one uppercase letter, one lowercase letter, one number, and one special character. Common patterns are not allowed.';
  }
}

export function IsStrongPassword(validationOptions?: ValidationOptions) {
  return function (object: Object, propertyName: string) {
    registerDecorator({
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      constraints: [],
      validator: IsStrongPasswordConstraint,
    });
  };
}

