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
import { Body, Controller, Delete, Get, Param, Patch, Post, Query, Req, UnauthorizedException, } from '@nestjs/common';
import { DevToolsService } from './dev-tools.service.js';
let DevToolsController = class DevToolsController {
    devToolsService;
    constructor(devToolsService) {
        this.devToolsService = devToolsService;
    }
    assertLocalAccess(request) {
        const expectedToken = process.env.DEV_DASHBOARD_TOKEN || 'local-dev-dashboard';
        const remoteAddress = request.socket.remoteAddress ?? '';
        const isLoopback = remoteAddress === '127.0.0.1' ||
            remoteAddress === '::1' ||
            remoteAddress === '::ffff:127.0.0.1';
        const proxyToken = request.header('x-dev-dashboard-token');
        if (isLoopback || proxyToken === expectedToken) {
            return;
        }
        throw new UnauthorizedException('Dev tools are restricted to local dashboard access');
    }
    getModels(request) {
        this.assertLocalAccess(request);
        return this.devToolsService.getModelsOverview();
    }
    getModelSchema(request, model) {
        this.assertLocalAccess(request);
        return this.devToolsService.getModelSchema(model);
    }
    runQuery(request, body) {
        this.assertLocalAccess(request);
        return this.devToolsService.runQuery(body.sql);
    }
    findMany(request, model, take, skip, where, orderBy) {
        this.assertLocalAccess(request);
        return this.devToolsService.findMany(model, {
            take,
            skip,
            where,
            orderBy,
        });
    }
    findOne(request, model, id) {
        this.assertLocalAccess(request);
        return this.devToolsService.findOne(model, id);
    }
    create(request, model, body) {
        this.assertLocalAccess(request);
        return this.devToolsService.create(model, body);
    }
    update(request, model, id, body) {
        this.assertLocalAccess(request);
        return this.devToolsService.update(model, id, body);
    }
    remove(request, model, id) {
        this.assertLocalAccess(request);
        return this.devToolsService.remove(model, id);
    }
};
__decorate([
    Get('models'),
    __param(0, Req()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], DevToolsController.prototype, "getModels", null);
__decorate([
    Get('models/:model'),
    __param(0, Req()),
    __param(1, Param('model')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], DevToolsController.prototype, "getModelSchema", null);
__decorate([
    Post('query'),
    __param(0, Req()),
    __param(1, Body()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", void 0)
], DevToolsController.prototype, "runQuery", null);
__decorate([
    Get(':model'),
    __param(0, Req()),
    __param(1, Param('model')),
    __param(2, Query('take')),
    __param(3, Query('skip')),
    __param(4, Query('where')),
    __param(5, Query('orderBy')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, String, String, String, String]),
    __metadata("design:returntype", void 0)
], DevToolsController.prototype, "findMany", null);
__decorate([
    Get(':model/:id'),
    __param(0, Req()),
    __param(1, Param('model')),
    __param(2, Param('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, String]),
    __metadata("design:returntype", void 0)
], DevToolsController.prototype, "findOne", null);
__decorate([
    Post(':model'),
    __param(0, Req()),
    __param(1, Param('model')),
    __param(2, Body()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, Object]),
    __metadata("design:returntype", void 0)
], DevToolsController.prototype, "create", null);
__decorate([
    Patch(':model/:id'),
    __param(0, Req()),
    __param(1, Param('model')),
    __param(2, Param('id')),
    __param(3, Body()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, String, Object]),
    __metadata("design:returntype", void 0)
], DevToolsController.prototype, "update", null);
__decorate([
    Delete(':model/:id'),
    __param(0, Req()),
    __param(1, Param('model')),
    __param(2, Param('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, String]),
    __metadata("design:returntype", void 0)
], DevToolsController.prototype, "remove", null);
DevToolsController = __decorate([
    Controller('dev/db'),
    __metadata("design:paramtypes", [DevToolsService])
], DevToolsController);
export { DevToolsController };
//# sourceMappingURL=dev-tools.controller.js.map