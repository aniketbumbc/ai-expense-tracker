FROM node:24-alpine

WORKDIR /app
RUN corepack enable

COPY package.json pnpm-lock.yaml ./
# tsx (devDependency) is the runtime, so install everything
RUN pnpm install --frozen-lockfile

COPY . .

ENV NODE_ENV=production \
    PORT=4100 \
    DB_PATH=/data/expenses.db

# sqlite lives on a mounted volume; owned by the non-root user
RUN mkdir -p /data && chown node:node /data
USER node

EXPOSE 4100
CMD ["node_modules/.bin/tsx", "server.ts"]
