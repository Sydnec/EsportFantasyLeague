import { PrismaService } from '../prisma/prisma.service.js';
import { UpdateUserDto } from './dto/update-user.dto.js';
import { UpdatePasswordDto } from './dto/update-password.dto.js';
export declare class UsersService {
    private prisma;
    constructor(prisma: PrismaService);
    findById(userId: string): Promise<{
        hasPassword: boolean;
        isGoogleLinked: boolean;
        email: string;
        username: string;
        id: string;
        avatarUrl: string | null;
        createdAt: Date;
        leagueMemberships: {
            league: {
                id: string;
                name: string;
                games: import("@prisma/client").$Enums.Game[];
            };
            totalScore: number;
        }[];
    }>;
    update(userId: string, dto: UpdateUserDto): Promise<{
        email: string;
        username: string;
        id: string;
        avatarUrl: string | null;
    }>;
    updatePassword(userId: string, dto: UpdatePasswordDto): Promise<{
        success: boolean;
    }>;
}
