var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
import { IsString, IsEnum, IsInt, Min, Max, MinLength, MaxLength, IsArray, IsBoolean, IsOptional, } from 'class-validator';
import { Game } from '@prisma/client';
export class CreateLeagueDto {
    name;
    games;
    tournaments;
    rosterSize;
    cooldownDays;
    onlyCreatorInvites;
}
__decorate([
    IsString(),
    MinLength(3),
    MaxLength(50),
    __metadata("design:type", String)
], CreateLeagueDto.prototype, "name", void 0);
__decorate([
    IsArray(),
    IsEnum(Game, { each: true }),
    __metadata("design:type", Array)
], CreateLeagueDto.prototype, "games", void 0);
__decorate([
    IsArray(),
    IsString({ each: true }),
    __metadata("design:type", Array)
], CreateLeagueDto.prototype, "tournaments", void 0);
__decorate([
    IsInt(),
    Min(1),
    Max(10),
    __metadata("design:type", Number)
], CreateLeagueDto.prototype, "rosterSize", void 0);
__decorate([
    IsInt(),
    Min(1),
    Max(30),
    __metadata("design:type", Number)
], CreateLeagueDto.prototype, "cooldownDays", void 0);
__decorate([
    IsOptional(),
    IsBoolean(),
    __metadata("design:type", Boolean)
], CreateLeagueDto.prototype, "onlyCreatorInvites", void 0);
//# sourceMappingURL=create-league.dto.js.map