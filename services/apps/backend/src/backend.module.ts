import { Module } from '@nestjs/common';
import { AuthModule } from './auth/auth.module';
import { LeaguesModule } from './leagues/leagues.module';
import { PrismaModule } from './prisma/prisma.module';
import { UsersModule } from './users/users.module';

@Module({
  imports: [PrismaModule, AuthModule, UsersModule, LeaguesModule],
  controllers: [],
  providers: [],
})
export class BackendModule {}
