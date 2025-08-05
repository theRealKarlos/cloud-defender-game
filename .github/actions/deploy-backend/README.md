# Deploy Backend Action

This custom GitHub Action deploys the Cloud Defenders backend application to AWS Lambda with comprehensive packaging, verification, and deployment capabilities.

## Features

- 📦 **Pre-built Artefact Deployment**: Expects pre-built backend artefacts (no internal build process)
- 🔄 **Lambda Version Management**: Creates new Lambda versions for rollback capability
- 🎯 **Alias-based Deployment**: Uses Lambda aliases for zero-downtime deployments
- ✅ **Automated Rollback**: Reverts alias to previous version on deployment failure
- 🔍 **Package Validation**: Verifies package size and structure
- 🚀 **Zero-downtime Deployment**: Updates alias to point to new version
- 📊 **Detailed Reporting**: Provides comprehensive deployment summaries

## Usage

```yaml
- name: Deploy Backend to Lambda
  uses: ./.github/actions/deploy-backend
  with:
    function-name: 'cloud-defenders-api'
    environment: 'production'
    aws-region: 'eu-west-2'
    runtime: 'nodejs22.x'
    timeout: '30'
    memory-size: '256'
    environment-variables: '{"NODE_ENV":"production","LOG_LEVEL":"info"}'
```

## Inputs

| Input | Description | Required | Default |
|-------|-------------|----------|---------|
| `aws-region` | AWS region for deployment | No | `eu-west-2` |
| `function-name` | Lambda function name | Yes | - |
| `source-directory` | Source directory for backend code | No | `./backend` |
| `environment` | Deployment environment | No | `development` |
| `runtime` | Lambda runtime version | No | `nodejs22.x` |
| `timeout` | Function timeout in seconds | No | `30` |
| `memory-size` | Function memory size in MB | No | `256` |
| `environment-variables` | JSON string of environment variables | No | `{}` |
| `dry-run` | Perform dry run without deployment | No | `false` |
| `package-exclude` | Files/patterns to exclude from package | No | `__tests__,*.test.js,*.spec.js,.env*,README.md` |

## Outputs

| Output | Description |
|--------|-------------|
| `function-arn` | ARN of the deployed Lambda function |
| `function-url` | Function URL if configured |
| `package-size` | Size of the deployment package |
| `deployment-status` | Status of the deployment |

## Prerequisites

- AWS CLI configured with appropriate permissions
- Lambda function must already exist (created via Terraform)
- Node.js backend application with `package.json`

## Deployment Process

1. **Artefact Validation**: Verifies source directory exists and contains required files
2. **Current Version Capture**: Gets current alias information for rollback capability
3. **Package Creation**: Creates optimised ZIP package from pre-built artefacts
4. **Version Publishing**: Publishes new Lambda version with updated code
5. **Alias Update**: Updates the `live` alias to point to new version
6. **Health Verification**: Performs health checks on new deployment
7. **Rollback on Failure**: Reverts alias to previous version if verification fails
8. **Reporting**: Generates comprehensive deployment summary

## Package Optimisation

The action creates deployment packages from pre-built artefacts:
- **Source Files**: Includes all backend source code and dependencies
- **Node Modules**: Includes production dependencies (`node_modules`)
- **Configuration**: Includes environment-specific configuration
- **Exclusions**: Automatically excludes development files and documentation

## Security Features

- Uses production dependencies only
- Validates package size against AWS limits
- Supports dry-run mode for testing
- Provides detailed logging for audit trails

## Error Handling

The action includes comprehensive error handling for:
- Missing or invalid artefacts
- Package creation issues
- Lambda version publishing failures
- Alias update failures
- Health check failures (triggers automatic rollback)
- Rollback failures (provides clear error messages)

## Example Workflows

### Development Deployment
```yaml
name: Deploy to Development
on:
  push:
    branches: [development]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - name: Configure AWS credentials
        uses: aws-actions/configure-aws-credentials@v4
        with:
          role-to-assume: ${{ secrets.AWS_ROLE_ARN_DEV }}
          aws-region: eu-west-2
          
      - name: Deploy Backend
        uses: ./.github/actions/deploy-backend
        with:
          function-name: 'cloud-defenders-api-dev'
          environment: 'development'
```

### Production Deployment with Approval
```yaml
name: Deploy to Production
on:
  workflow_dispatch:

jobs:
  deploy:
    runs-on: ubuntu-latest
    environment: production
    steps:
      - uses: actions/checkout@v4
      
      - name: Configure AWS credentials
        uses: aws-actions/configure-aws-credentials@v4
        with:
          role-to-assume: ${{ secrets.AWS_ROLE_ARN_PROD }}
          aws-region: eu-west-2
          
      - name: Deploy Backend
        uses: ./.github/actions/deploy-backend
        with:
          function-name: 'cloud-defenders-api'
          environment: 'production'
          runtime: 'nodejs22.x'
          timeout: '60'
          memory-size: '512'
          environment-variables: '{"NODE_ENV":"production","LOG_LEVEL":"warn"}'
```

## Troubleshooting

### Common Issues

1. **Function not found**: Ensure Lambda function exists and is created via Terraform
2. **Package too large**: Check package size and consider excluding additional files
3. **Permission denied**: Verify AWS credentials have Lambda update permissions
4. **Build failures**: Check build script in `package.json` and dependencies

### Debug Mode

Enable debug logging by setting:
```yaml
env:
  ACTIONS_STEP_DEBUG: true
```

## Requirements Compliance

This action fulfils the following project requirements:

- **Requirement 5.1**: Supports deployment to development environment when code is pushed to development branch
- **Requirement 6.2**: Creates Lambda deployment packages when Lambda functions are built

## Contributing

When modifying this action:
1. Test with dry-run mode first
2. Verify package optimisation works correctly
3. Ensure error handling covers new scenarios
4. Update documentation for any new inputs/outputs