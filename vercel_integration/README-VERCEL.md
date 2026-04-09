# StressGPT7 - Vercel Deployment

## Overview

This directory contains the complete Vercel deployment configuration for StressGPT7 AI Assistant. The system is optimized for serverless deployment on Vercel with full API functionality and web interface.

## Features

- **Multi-language Code Generation**: Python, Java, C, C++, C#, JavaScript
- **Advanced AI Assistant**: Natural language processing and responses
- **Production-ready API**: Complete REST API with all endpoints
- **Modern Web Interface**: Professional GUI with real-time interaction
- **Serverless Architecture**: Optimized for Vercel's serverless platform
- **CORS Enabled**: Cross-origin requests supported
- **Health Monitoring**: System health and statistics endpoints

## Quick Start

### 1. Deploy to Vercel

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel --prod
```

### 2. Or Connect GitHub Repository

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Click "New Project"
3. Import your GitHub repository
4. Configure deployment settings

## Configuration Files

### `vercel.json`
- Serverless function configuration
- CORS headers setup
- Route mappings for API endpoints
- Environment variables

### `package.json`
- Node.js 18.x runtime
- Production dependencies
- Build and deployment scripts

### `start-final.js`
- Complete self-contained server
- AI engine with multi-language support
- API endpoint handlers
- Static file serving

## API Endpoints

### Core Endpoints

- `GET /api/health` - Health check
- `POST /api/chat` - Chat with AI assistant
- `POST /api/code` - Generate code
- `GET /api/languages` - Supported languages
- `GET /api/stats` - System statistics
- `GET /api/docs` - API documentation

### Web Interface

- `/` or `/app.html` - Main web interface

## Usage Examples

### Chat API
```bash
curl -X POST https://your-app.vercel.app/api/chat \
  -H "Content-Type: application/json" \
  -d '{"message": "hello"}'
```

### Code Generation API
```bash
curl -X POST https://your-app.vercel.app/api/code \
  -H "Content-Type: application/json" \
  -d '{"prompt": "Write hello world in python", "language": "python"}'
```

### Health Check
```bash
curl https://your-app.vercel.app/api/health
```

## Environment Variables

Set these in your Vercel dashboard:

- `NODE_ENV` - Set to "production" (automatically)
- `PORT` - Set to "3000" (automatically)

## Performance

- **Cold Start**: ~2-3 seconds
- **Warm Response**: <500ms
- **Memory**: 1024MB limit
- **Timeout**: 30 seconds
- **Regions**: Multiple regions supported

## Limitations

- Serverless functions have a 30-second timeout
- Memory limited to 1024MB
- No persistent file system (serverless)
- No background processes

## Development

### Local Development
```bash
# Install dependencies
npm install

# Run locally
node start-final.js
```

### Testing
```bash
# Test API endpoints
curl http://localhost:3000/api/health

# Test chat
curl -X POST http://localhost:3000/api/chat \
  -H "Content-Type: application/json" \
  -d '{"message": "hello"}'
```

## Deployment Troubleshooting

### Common Issues

1. **Function Timeout**
   - Reduce processing time
   - Optimize AI responses
   - Use streaming for long responses

2. **Memory Limits**
   - Optimize code generation
   - Reduce session storage
   - Use external storage for large data

3. **CORS Issues**
   - Check vercel.json headers
   - Verify API endpoint configuration
   - Test with different origins

### Debugging

Enable debug mode:
```bash
DEBUG=* vercel dev
```

## Architecture

```
vercel_integration/
  start-final.js          # Main serverless function
  app.html               # Web interface
  vercel.json           # Vercel configuration
  package.json          # Dependencies
  README-VERCEL.md      # This file
```

## Support

For issues with Vercel deployment:
- Check [Vercel Documentation](https://vercel.com/docs)
- Review deployment logs
- Test locally first

For StressGPT7 issues:
- Check GitHub repository
- Review API documentation
- Test with simple requests

## Updates

To update the deployed version:
1. Push changes to GitHub
2. Vercel will automatically redeploy
3. Or use `vercel --prod` for manual deployment

## License

MIT License - see main repository for details.
