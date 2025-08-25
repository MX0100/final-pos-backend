FROM node:20-alpine AS base
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
COPY package*.json ./
RUN npm ci --omit=dev
COPY --from=base /app/dist ./dist
EXPOSE 3000
CMD ["node", "dist/src/main.js"]

FROM base AS tester
ENV NODE_ENV=test
RUN apk add --no-cache netcat-openbsd
CMD ["npm", "run", "test:e2e"]
