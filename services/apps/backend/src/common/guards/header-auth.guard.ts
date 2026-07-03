import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';

/**
 * Ce Guard s'appuie sur le fait que l'API Gateway a déjà validé le jeton JWT.
 * L'API Gateway injecte 'x-user-id' (et 'x-user-role') dans les en-têtes de la requête.
 * Si l'en-tête est manquant, cela signifie que la requête n'est pas authentifiée.
 */
@Injectable()
export class HeaderAuthGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const userId = request.headers['x-user-id'];

    if (!userId) {
      throw new UnauthorizedException(
        'Missing authentication context from Gateway',
      );
    }

    // On attache l'utilisateur à la requête pour faciliter l'accès dans les contrôleurs
    request.user = {
      id: userId,
      role: request.headers['x-user-role'] || 'USER',
    };

    return true;
  }
}
