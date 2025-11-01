# MCP-Tavily Dashboard

A monitoring dashboard for the MCP-Tavily server, providing real-time visualization of server metrics, connections, and tool usage.

## Features

- **Real-time Monitoring**: Live updates of server metrics and connections
- **Connection Management**: View active WebSocket connections
- **Tool Usage Tracking**: Monitor usage statistics for various tools
- **Health Checks**: Server status and uptime monitoring
- **Log Viewer**: Access server logs in real-time

## Project Structure

```
mcp-tavily-dash/
├── mcp_tavily_server.py  # FastAPI server with WebSocket support
├── index.html           # Dashboard frontend
├── app.js               # Frontend JavaScript logic
├── style.css            # Dashboard styling
├── requirements.txt     # Python dependencies
├── railway.json         # Railway deployment configuration
└── __pycache__/         # Python compiled files
```

## Installation

1. Clone or download the project files
2. Install Python dependencies:
   ```bash
   pip install -r requirements.txt
   ```

## Running the Dashboard

Start the FastAPI server:
```bash
python -m uvicorn mcp_tavily_server:app --host 0.0.0.0 --port 8000
```

The dashboard will be available at: `http://localhost:8000`

## API Endpoints

- `GET /` - Dashboard homepage
- `GET /health` - Health check endpoint
- `GET /api/metrics` - Server metrics
- `GET /api/tools` - Available tools
- `GET /api/connections` - Active connections
- `GET /api/logs` - Server logs
- `WS /ws/{client_id}` - WebSocket endpoint for real-time communication

## Deployment

This project includes a `railway.json` configuration file for easy deployment on Railway. The dashboard is configured to run on port 8000.

## Usage

1. Open the dashboard in your browser
2. Monitor server metrics in real-time
3. View active connections and tool usage
4. Access server logs for debugging

## Dependencies

- FastAPI - Web framework
- Uvicorn - ASGI server
- WebSocket support for real-time updates
- Pydantic for data validation

## Note

This dashboard is designed to monitor the MCP-Tavily server. The `/@vite/client` 404 errors in the console are expected and do not affect functionality - they are remnants of development tooling that isn't used in production.

## License

This project is part of the MCP-Tavily ecosystem.