import { BadRequestException } from '@nestjs/common';
import { UserRegistrationDto } from '../Modules/Auth/Dto/Auth-Dto'; // Assuming you have a DTO defined

export async function validateRegistrationData(data: UserRegistrationDto): Promise<boolean> {
    // Ensure all required fields are present
    const requiredFields: (keyof UserRegistrationDto)[] = ['userName', 'emailAddress', 'phoneNumber', 'password'];
    for (const field of requiredFields) {
        if (!data[field]) {
            throw new BadRequestException(`'${field}' is required`);
        }
    }

    // Validate email format
    const emailRegex = /^[\w\.-]+@[\w\.-]+\.\w+$/;
    if (!emailRegex.test(data.emailAddress)) {
        throw new BadRequestException('Invalid email format');
    }

    // Validate phone number format (Assumes 10-digit phone number)
    const phoneRegex = /^\+?[1-9]\d{1,14}$/;
    if (!phoneRegex.test(data.phoneNumber)) {
        throw new BadRequestException('Invalid phone number format');
    }


    // Check password complexity
    if (data.password.length < 8) {
        throw new BadRequestException('Password must be at least 8 characters long');
    }
    if (!/\d/.test(data.password)) {
        throw new BadRequestException('Password must contain at least one digit');
    }
    if (!/[a-zA-Z]/.test(data.password)) {
        throw new BadRequestException('Password must contain at least one letter');
    }

    // All validations passed
    return true;
}
