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
import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import { ProPlayersService } from './pro-players.service.js';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard.js';
import { Game } from '@prisma/client';
let ProPlayersController = class ProPlayersController {
    proPlayersService;
    constructor(proPlayersService) {
        this.proPlayersService = proPlayersService;
    }
    findAll(game, team, role) {
        return this.proPlayersService.findAll({ game, team, role });
    }
    findByMatchDay(matchDayId) {
        return this.proPlayersService.findByMatchDay(matchDayId);
    }
    findOne(id) {
        return this.proPlayersService.findById(id);
    }
};
__decorate([
    Get(),
    __param(0, Query('game')),
    __param(1, Query('team')),
    __param(2, Query('role')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String]),
    __metadata("design:returntype", void 0)
], ProPlayersController.prototype, "findAll", null);
__decorate([
    Get('match-day/:matchDayId'),
    __param(0, Param('matchDayId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], ProPlayersController.prototype, "findByMatchDay", null);
__decorate([
    Get(':id'),
    __param(0, Param('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], ProPlayersController.prototype, "findOne", null);
ProPlayersController = __decorate([
    Controller('pro-players'),
    UseGuards(JwtAuthGuard),
    __metadata("design:paramtypes", [ProPlayersService])
], ProPlayersController);
export { ProPlayersController };
//# sourceMappingURL=pro-players.controller.js.map