var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
import { Module } from '@nestjs/common';
import { IngestionService } from './ingestion.service.js';
import { PandaScoreService } from './pandascore.service.js';
import { IngestionController } from './ingestion.controller.js';
import { ScoringModule } from '../scoring/scoring.module.js';
let IngestionModule = class IngestionModule {
};
IngestionModule = __decorate([
    Module({
        imports: [ScoringModule],
        controllers: [IngestionController],
        providers: [IngestionService, PandaScoreService],
    })
], IngestionModule);
export { IngestionModule };
//# sourceMappingURL=ingestion.module.js.map