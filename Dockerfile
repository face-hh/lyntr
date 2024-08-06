FROM node:lts-bullseye
WORKDIR /app

COPY . .

RUN npm install
RUN npm run build

EXPOSE 5999/tcp

ENV HOST=0.0.0.0
ENV PORT=5999
ENV BODY_SIZE_LIMIT=8000000

CMD ["node", "build/index.js"]
