import { UsersService } from './users.service.js';
import { UpdateUserDto } from './dto/update-user.dto.js';
import { UpdatePasswordDto } from './dto/update-password.dto.js';
import { JwtPayload } from '../common/decorators/current-user.decorator.js';
export declare class UsersController {
    private usersService;
    constructor(usersService: UsersService);
    getProfile(user: JwtPayload): Promise<{
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
    updateProfile(user: JwtPayload, dto: UpdateUserDto): Promise<{
        email: string;
        username: string;
        id: string;
        avatarUrl: string | null;
    }>;
    updatePassword(user: JwtPayload, dto: UpdatePasswordDto): Promise<{
        success: boolean;
    }>;
}
