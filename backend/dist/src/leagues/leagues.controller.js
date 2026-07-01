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
import { Controller, Post, Get, Param, Body, UseGuards, Delete, } from '@nestjs/common';
import { LeaguesService } from './leagues.service.js';
import { CreateLeagueDto } from './dto/create-league.dto.js';
import { JoinLeagueDto } from './dto/join-league.dto.js';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard.js';
import { CurrentUser, } from '../common/decorators/current-user.decorator.js';
let LeaguesController = class LeaguesController {
    leaguesService;
    constructor(leaguesService) {
        this.leaguesService = leaguesService;
    }
    create(user, dto) {
        return this.leaguesService.create(user.userId, dto);
    }
    findAll(user) {
        return this.leaguesService.findUserLeagues(user.userId);
    }
    getUpcomingTournaments() {
        return this.leaguesService.getUpcomingTournaments();
    }
    findOne(id) {
        return this.leaguesService.findById(id);
    }
    join(user, dto) {
        return this.leaguesService.join(user.userId, dto.inviteCode);
    }
    leaderboard(id) {
        return this.leaguesService.getLeaderboard(id);
    }
    remove(user, id) {
        return this.leaguesService.remove(user.userId, id);
    }
};
__decorate([
    Post(),
    __param(0, CurrentUser()),
    __param(1, Body()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, CreateLeagueDto]),
    __metadata("design:returntype", void 0)
], LeaguesController.prototype, "create", null);
__decorate([
    Get(),
    __param(0, CurrentUser()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], LeaguesController.prototype, "findAll", null);
__decorate([
    Get('upcoming-tournaments'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], LeaguesController.prototype, "getUpcomingTournaments", null);
__decorate([
    Get(':id'),
    __param(0, Param('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], LeaguesController.prototype, "findOne", null);
__decorate([
    Post(':id/join'),
    __param(0, CurrentUser()),
    __param(1, Body()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, JoinLeagueDto]),
    __metadata("design:returntype", void 0)
], LeaguesController.prototype, "join", null);
__decorate([
    Get(':id/leaderboard'),
    __param(0, Param('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], LeaguesController.prototype, "leaderboard", null);
__decorate([
    Delete(':id'),
    __param(0, CurrentUser()),
    __param(1, Param('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], LeaguesController.prototype, "remove", null);
LeaguesController = __decorate([
    Controller('leagues'),
    UseGuards(JwtAuthGuard),
    __metadata("design:paramtypes", [LeaguesService])
], LeaguesController);
export { LeaguesController };
//# sourceMappingURL=leagues.controller.js.map