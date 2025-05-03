{
  "mcpServers": {
    "browser-tools": {
      "command": "cmd",
      "args": [
        "/c", 
        "npx", 
        "-y", 
        "@agentdeskai/browser-tools-mcp@1.2.0"
      ],
      "enabled": true
    },
    "postgresql-mcp": {
      "command": "node",
      "args": ["D:\\Belgeler\\postgresql-mcp-server-main\\postgresql-mcp-server-main\\build\\index.js"],
      "disabled": false,
      "alwaysAllow": []
    },
    "server-sequential-thinking": {
      "command": "npx",
      "args": [
        "-y",
        "@smithery/cli@latest",
        "run",
        "@smithery-ai/server-sequential-thinking",
        "--key",
        "a85e0977-83cf-42da-b227-3f773b1d041e"
      ]
    }
  }
}