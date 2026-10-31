FROM node:20-alpine AS build
WORKDIR /app

COPY package.json ./
COPY package-lock.json ./

RUN npm ci

COPY backend ./backend
COPY scripts ./scripts
COPY src ./src
COPY public ./public
COPY index.html ./
COPY tsconfig.json ./
COPY tsconfig.node.json ./
COPY vite.config.ts ./

RUN npm run build

FROM node:20-alpine AS runtime
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=4000

COPY package.json ./
COPY package-lock.json ./

RUN npm ci --omit=dev

COPY backend ./backend
COPY scripts ./scripts
COPY --from=build /app/dist ./dist

EXPOSE 4000
CMD ["node", "backend/server.js"]
