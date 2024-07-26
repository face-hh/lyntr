FROM node:20-alpine

WORKDIR /app

COPY . .

RUN npm install
RUN npm run build

EXPOSE 5999/tcp

ENV HOST=0.0.0.0
ENV PORT=5999

CMD [ "BODY_SIZE_LIMIT=8000", "node", "build/index.js" ]
