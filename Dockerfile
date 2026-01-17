FROM node:24-alpine AS build

WORKDIR /app

COPY .. .
RUN npm install

ENV PORT=8080
EXPOSE 8080

CMD ["npm", "run", "start:debug"]
