# Use an official Node.js runtime as a parent image
FROM node:20-alpine

WORKDIR /app

# Copy package.json and package-lock.json
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy the rest of the application's source code
COPY . .

# Build the app (if using TypeScript)
# Expose the port the app runs on
EXPOSE 3002

# Define the command to run the app in production
CMD ["npm", "run", "start:dev"] 