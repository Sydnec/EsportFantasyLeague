FROM node:22-alpine AS builder

WORKDIR /app

ENV DATABASE_URL=postgresql://dummy

COPY package*.json ./
RUN npm install

COPY . .

RUN npx prisma generate
RUN npm run build

FROM node:22-alpine

WORKDIR /app

RUN chown -R node:node /app

COPY --chown=node:node package*.json ./
RUN npm install --omit=dev

COPY --chown=node:node --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --chown=node:node --from=builder /app/node_modules/@prisma ./node_modules/@prisma
COPY --chown=node:node --from=builder /app/dist ./dist
COPY --chown=node:node --from=builder /app/prisma ./prisma

USER node

EXPOSE 3000

CMD ["npm", "run", "start:prod"]
