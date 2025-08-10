# Manifest Pointer Architecture

## Overview

The Cloud Defenders game now implements a **Manifest Pointer** architecture for zero-downtime deployments and instant rollbacks. This pattern separates the bootstrap loader from the main application, enabling advanced deployment strategies.

## Architecture Components

### 1. Root Files (S3 Bucket Root)

These files are deployed directly to the S3 bucket root and serve as the entry point:

- **`/index.html`** - Bootstrap loader that dynamically loads the current version
- **`/manifest.json`** - Points to the current active version folder
- **`/config.json`** - Game configuration (not versioned)
- **`/diagnostics/`** - Health check and diagnostic tools (not versioned)

### 2. Versioned Files (Timestamped Folders)

The main game application is deployed to timestamped folders:

- **`/v20241201-143022/index.html`** - Main game HTML
- **`/v20241201-143022/js/game.js`** - Game logic
- **`/v20241201-143022/styles/game.css`** - Game styles
- **`/v20241201-143022/js/*.js`** - All JavaScript modules
- **`/v20241201-143022/styles/*.css`** - All CSS files

## How It Works

### Deployment Process

1. **Version Creation**: New deployment creates timestamped folder (e.g., `v20241201-143022`)
2. **File Upload**: All game files uploaded to the versioned folder
3. **Manifest Update**: `manifest.json` updated to point to new version
4. **Bootstrap Load**: Root `index.html` fetches manifest and loads new version

### Bootstrap Loader Flow

```
User visits / → Bootstrap loader loads → Fetches /manifest.json →
Loads /{version}/index.html → Game runs from versioned folder
```

### Rollback Process

1. **Instant Rollback**: Update `manifest.json` to point to previous version
2. **No Redeployment**: Old version remains available in its folder
3. **Immediate Effect**: Bootstrap loader picks up change on next page load

## Benefits

### 1. Zero Downtime Deployments

- New version deployed to separate folder
- Switch happens instantly via manifest update
- No interruption to user experience

### 2. Instant Rollbacks

- Rollback by updating single manifest file
- No need to redeploy or wait for builds
- Previous version immediately available

### 3. Cache Management

- Bootstrap loader: `no-cache` (always fresh)
- Game files: `max-age=31536000` (1 year cache)
- Manifest: `no-cache` (always fresh)

### 4. Clean Separation

- Bootstrap logic separate from game logic
- Configuration separate from application
- Diagnostics always accessible

## File Structure

```
S3 Bucket Root:
├── index.html (bootstrap loader)
├── manifest.json (version pointer)
├── config.json (game config)
├── diagnostics/ (health tools)
└── v20241201-143022/ (versioned game)
    ├── index.html (main game)
    ├── js/
    ├── styles/
    └── assets/
```

## Deployment Script Changes

The `deploy-frontend.ps1` script has been updated to:

1. **Create Versioned Folders**: Timestamp-based versioning
2. **Deploy Game Files**: Upload to versioned folder
3. **Deploy Bootstrap**: Upload loader to root
4. **Update Manifest**: Point to new version
5. **Set Content Types**: Proper MIME types for all files

## Testing

Use `frontend/test-manifest-pointer.html` to test the architecture locally:

- Bootstrap loader simulation
- Manifest structure validation
- Path construction examples

## Security Considerations

- Bootstrap loader validates manifest format
- Retry logic with exponential backoff
- Error handling for malformed manifests
- No sensitive data in versioned folders

## Future Enhancements

- **A/B Testing**: Multiple manifest versions for testing
- **Gradual Rollouts**: Percentage-based traffic splitting
- **Health Checks**: Automatic rollback on failures
- **Version Cleanup**: Automated cleanup of old versions
