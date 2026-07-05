# Etape 1 : Build
FROM node:22-alpine AS builder
WORKDIR /usr/src/app
COPY package*.json ./
COPY services/package*.json ./services/
RUN npm ci
COPY . .
RUN npx prisma generate --schema=services/apps/backend/prisma/schema.prisma
RUN cd services && npx nest build backend

# Etape 2 : Production Run
FROM node:22-alpine AS runner
WORKDIR /usr/src/app
ENV NODE_ENV=production
COPY package*.json ./
COPY services/package*.json ./services/
RUN npm ci --only=production

# On récupère le dossier dist qui a été buildé dans le sous-dossier de services
COPY --from=builder /usr/src/app/services/dist ./dist
COPY --from=builder /usr/src/app/services/node_modules/@prisma/client-backend ./node_modules/@prisma/client-backend
COPY --from=builder /usr/src/app/services/apps/backend/prisma ./services/apps/backend/prisma

EXPOSE 3001

# Le db push s'exécute désormais au démarrage du conteneur, suivi du lancement de l'application
CMD ["sh", "-c", "npx prisma db push --schema=services/apps/backend/prisma/schema.prisma --accept-data-loss && node dist/apps/backend/apps/backend/src/main.js"]