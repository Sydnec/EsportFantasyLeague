# Etape 1 : Build
FROM node:22-alpine AS builder
WORKDIR /usr/src/app
COPY package*.json ./
COPY services/package*.json ./services/
RUN npm ci
COPY . .
# Plus besoin de dotenv-cli ici, generate a juste besoin du fichier schema.prisma
RUN npx prisma generate --schema=services/apps/esport-adapter/prisma/schema.prisma
RUN cd services && npx nest build esport-adapter

# Etape 2 : Production Run
FROM node:22-alpine AS runner
WORKDIR /usr/src/app
ENV NODE_ENV=production
COPY package*.json ./
COPY services/package*.json ./services/
RUN npm ci --only=production

# On récupère les builds et prisma depuis les bons sous-dossiers
COPY --from=builder /usr/src/app/services/dist ./dist
COPY --from=builder /usr/src/app/services/node_modules/@prisma/client-esport ./node_modules/@prisma/client-esport
COPY --from=builder /usr/src/app/services/apps/esport-adapter/prisma ./services/apps/esport-adapter/prisma

EXPOSE 3002

# Si ce service a aussi besoin de pousser son schéma à la BDD au démarrage :
CMD ["sh", "-c", "npx prisma db push --schema=services/apps/esport-adapter/prisma/schema.prisma --accept-data-loss && node dist/apps/esport-adapter/apps/esport-adapter/src/main.js"]