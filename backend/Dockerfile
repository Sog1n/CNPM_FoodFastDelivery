FROM node:18-alpine AS builder

WORKDIR /app

# Install build dependencies
RUN apk add --no-cache python3 make g++ gcc

COPY package*.json ./

# Install dependencies and rebuild bcrypt
RUN npm ci
RUN npm rebuild bcrypt --build-from-source


FROM node:18-alpine

WORKDIR /app

COPY --from=builder /app/node_modules ./node_modules
COPY . .

EXPOSE 3000

CMD ["npm", "start"]