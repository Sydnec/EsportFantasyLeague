import { Role } from '@prisma/client';
export interface JwtPayload {
    userId: string;
    email: string;
    role: Role;
}
export declare const CurrentUser: (...dataOrPipes: unknown[]) => ParameterDecorator;
