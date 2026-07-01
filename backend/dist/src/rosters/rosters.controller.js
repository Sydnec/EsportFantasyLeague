var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
import { Controller, Post, Get, Patch, Param, Body, Query, UseGuards, } from '@nestjs/common';
import { RostersService } from './rosters.service.js';
import { CreateRosterDto } from './dto/create-roster.dto.js';
import { UpdateRosterDto } from './dto/update-roster.dto.js';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard.js';
import { CurrentUser, } from '../common/decorators/current-user.decorator.js';
let RostersController = class RostersController {
    rostersService;
    constructor(rostersService) {
        this.rostersService = rostersService;
    }
    create(user, dto) {
        return this.rostersService.create(user.userId, dto);
    }
    findAll(user, leagueId) {
        return this.rostersService.findUserRosters(user.userId, leagueId);
    }
    findByLeagueAndMatchDay(leagueId, matchDayId) {
        return this.rostersService.findLeagueRostersForMatchDay(leagueId, matchDayId);
    }
    findOne(id) {
        return this.rostersService.findById(id);
    }
    update(user, id, dto) {
        return this.rostersService.update(user.userId, id, dto);
    }
};
__decorate([
    Post(),
    __param(0, CurrentUser()),
    __param(1, Body()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, CreateRosterDto]),
    __metadata("design:returntype", void 0)
], RostersController.prototype, "create", null);
__decorate([
    Get(),
    __param(0, CurrentUser()),
    __param(1, Query('leagueId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], RostersController.prototype, "findAll", null);
__decorate([
    Get('league/:leagueId/match-day/:matchDayId'),
    __param(0, Param('leagueId')),
    __param(1, Param('matchDayId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", void 0)
], RostersController.prototype, "findByLeagueAndMatchDay", null);
__decorate([
    Get(':id'),
    __param(0, Param('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], RostersController.prototype, "findOne", null);
__decorate([
    Patch(':id'),
    __param(0, CurrentUser()),
    __param(1, Param('id')),
    __param(2, Body()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, UpdateRosterDto]),
    __metadata("design:returntype", void 0)
], RostersController.prototype, "update", null);
RostersController = __decorate([
    Controller('rosters'),
    UseGuards(JwtAuthGuard),
    __metadata("design:paramtypes", [RostersService])
], RostersController);
export { RostersController };
//# sourceMappingURL=rosters.controller.js.map