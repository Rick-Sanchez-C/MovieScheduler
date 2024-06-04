# Specify the base image
FROM node:20

# Create a directory for the application
WORKDIR /usr/src/app

# Copy the package files
COPY package*.json ./

# Install the dependencies
RUN npm install

# Copy the rest of the application files
COPY . .

# Expose the port your application uses
EXPOSE 8080

# Command to start the application
CMD [ "node", "App/index.js" ]