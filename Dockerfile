FROM oven/bun:1 AS dependencies
WORKDIR /app
COPY package.json bun.lock ./
RUN bun install --frozen-lockfile

FROM oven/bun:1
WORKDIR /app
COPY --from=dependencies --chown=bun:bun /app/node_modules ./node_modules
COPY --chown=bun:bun package.json drizzle.config.ts tsconfig.json ./
COPY --chown=bun:bun src ./src
USER bun

EXPOSE 8080
CMD ["bun", "run", "start"]
