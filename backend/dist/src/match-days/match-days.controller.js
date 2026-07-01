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
import { Controller, Get, Param, Query } from '@nestjs/common';
import { MatchDaysService } from './match-days.service.js';
import { Game, MatchDayStatus } from '@prisma/client';
let MatchDaysController = class MatchDaysController {
    matchDaysService;
    constructor(matchDaysService) {
        this.matchDaysService = matchDaysService;
    }
    findAll(game, status, date) {
        return this.matchDaysService.findAll({ game, status, date });
    }
    findOne(id) {
        return this.matchDaysService.findById(id);
    }
};
__decorate([
    Get(),
    __param(0, Query('game')),
    __param(1, Query('status')),
    __param(2, Query('date')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String]),
    __metadata("design:returntype", void 0)
], MatchDaysController.prototype, "findAll", null);
__decorate([
    Get(':id'),
    __param(0, Param('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], MatchDaysController.prototype, "findOne", null);
MatchDaysController = __decorate([
    Controller('match-days'),
    __metadata("design:paramtypes", [MatchDaysService])
], MatchDaysController);
export { MatchDaysController };
//# sourceMappingURL=match-days.controller.js.map