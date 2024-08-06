FROM oven/bun:latest AS base
WORKDIR /usr/src/app

FROM base AS install

RUN mkdir -p /temp/prod
COPY package.json bun.lockb /temp/prod/
COPY ./discord.ts /temp/prod/discord.ts
RUN cd /temp/prod && bun install --frozen-lockfile --production --verbose

FROM base AS release
COPY --from=install /temp/prod/node_modules ./node_modules/
COPY --from=install /temp/prod/discord.ts ./discord.ts
COPY --from=install /temp/prod/package.json ./package.json

USER bun
ENTRYPOINT ["bun", "--env-file=/run/secrets/serverEnv", "discord.ts"]
