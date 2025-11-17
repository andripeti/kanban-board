FROM node:18

WORKDIR /app

# Install dependencies first for better layer caching
COPY package*.json ./
RUN npm install

# Copy rest of the app
COPY . .

EXPOSE 3000

CMD ["npm", "run", "dev"]
