# Termix Documentation

Termix is a powerful web-based SSH terminal emulator that allows you to connect to your servers directly from your browser. With features like split screen, tab system, and saved hosts, Termix makes server management easier than ever.

## Installation

Termix can be installed using Docker, Docker Compose, or manually. Choose the method that works best for your environment.

### Docker Installation

The simplest way to get Termix up and running is with Docker:

```bash
# Create a persistent volume for MongoDB data
docker volume create mongodb-data

# Run the Termix container
docker run -d \
  --name termix \
  --restart unless-stopped \
  -p 8080:8080 \
  -v mongodb-data:/data/db \
  -e SALT="2v.F7!6a!jIzmJsu|[)h61$ZMXs;,i+~" \
  ghcr.io/lukegus/termix:latest
```

::: warning
Make sure to replace the SALT value with your own secure random string, using all characters and a maximum length of 32 characters. You can generate one at LastPass Password Generator.
:::

### Docker Compose Installation

For a more comprehensive setup, you can use Docker Compose:

```yaml
services:
  termix:
    image: ghcr.io/lukegus/termix:latest
    container_name: termix
    restart: unless-stopped
    ports:
      - "8080:8080"
    volumes:
      - termix-data:/app/data
    environment:
      # Generate random salt here https://www.lastpass.com/features/password-generator
      # (max 32 characters, include all characters for settings)
      SALT: "2v.F7!6a!jIzmJsu|[)h61$ZMXs;,i+~"
      PORT: "8080"

volumes:
  termix-data:
    driver: local
```

To start the container, run:

```bash
docker-compose up -d
```

### Manual Installation

If you prefer a manual installation, follow these steps:

#### Required Packages
- NPM
- NodeJS
- MongoDB

#### Installation Steps

1. Clone the repository:
```bash
git clone https://github.com/LukeGus/Termix.git
cd Termix
```

2. Install dependencies and build the project:
```bash
npm install
npm run build
```

3. Start the application:
```bash
npm run start
```

::: tip
For production environments, we recommend running the website via Nginx. See the Nginx configuration in the Docker directory of the repository.
:::

4. Start the backend services. Navigate to the backend directory:
```bash
cd src/backend
node database.cjs
node ssh.cjs
```

This will start the WebSocket services on ports 8081 and 8082.

## Usage

Once installed, Termix will be available at `http://localhost:8080` (or whichever port you configured).

1. Create an account or log in
2. Add your SSH connection details
3. Connect to your servers
4. Enjoy the terminal experience right in your browser!

## Security Considerations

- Always use a strong, unique SALT value
- Keep your server up to date with the latest Termix releases
- Consider using key-based authentication rather than passwords
- For production deployments, set up HTTPS using a reverse proxy

## Troubleshooting

If you encounter any issues:

1. Check the container logs: `docker logs termix`
2. Ensure the correct ports are exposed and not blocked by a firewall
3. Check the GitHub repository for known issues or to file a new one
