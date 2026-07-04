import { Body, Controller, Get, Patch, Req, UseGuards } from '@nestjs/common';
import { HeaderAuthGuard } from '../common/guards/header-auth.guard';
import { UpdatePasswordDto, UpdateProfileDto } from './dto/users.dto';
import { UsersService } from './users.service';

@Controller('users')
@UseGuards(HeaderAuthGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('me')
  getProfile(@Req() req: any) {
    return this.usersService.getProfile(req.user.id);
  }

  @Patch('me')
  updateProfile(@Req() req: any, @Body() dto: UpdateProfileDto) {
    return this.usersService.updateProfile(req.user.id, dto);
  }

  @Patch('me/password')
  updatePassword(@Req() req: any, @Body() dto: UpdatePasswordDto) {
    return this.usersService.updatePassword(req.user.id, dto);
  }
}
