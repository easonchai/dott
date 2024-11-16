FROM node:18-slim

# For compatibility with M1 Macs
RUN apt-get update && \
    apt-get install -y procps && \
    apt-get install -y openssl && \
    apt-get install -y libc6 && \
    apt-get install -y python3 make g++ && \
    apt-get install -y libpcsclite-dev

# Create app directory
WORKDIR /app

# npm install files
COPY package*.json ./
COPY prisma ./prisma/

# Install app dependencies
RUN npm install

CMD npm run start:dev