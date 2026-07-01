import { Strategy } from 'passport-jwt';
import { Request } from 'express';
import { PrismaService } from '../../prisma/prisma.service.js';
import { JwtPayload } from '../../common/decorators/current-user.decorator.js';
declare const JwtRefreshStrategy_base: new (...args: [opt: import("passport-jwt").StrategyOptionsWithRequest] | [opt: import("passport-jwt").StrategyOptionsWithoutRequest]) => Strategy & {
    validate(...args: any[]): unknown;
};
export declare class JwtRefreshStrategy extends JwtRefreshStrategy_base {
    private prisma;
    constructor(prisma: PrismaService);
    validate(req: Request, payload: JwtPayload): Promise<JwtPayload & {
        refreshToken: string;
    }>;
}
export {};
