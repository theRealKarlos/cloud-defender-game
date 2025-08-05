# Deploy Backend Action

This custom GitHub Action deploys the Cloud Defenders backend application to AWS Lambda with comprehensive packaging, verification, and deployment capabilities.

## Features

- 🏗️ **Automated Build Process**: Runs backend build scripts if available
- 📦 **Smart Packaging**: Creates optimised Lambda deployment packages
- 🔍 **Package Validation**: Verifies package size and structure
- 🚀 **Lambda Deployment**: Updates existing Lambda functions with new code
- ✅ **Deployment Verification**: Performs health checks and basic invocation tests
- 🧹 **Cleanup**: Automatically removes temporary files
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

1. **Validation**: Validates inputs and checks source directory structure
2. **Dependencies**: Installs production dependencies only
3. **Build**: Runs build script if available in `package.json`
4. **Packaging**: Creates optimised ZIP package excluding test files and development dependencies
5. **Deployment**: Updates Lambda function code and configuration
6. **Verification**: Waits for function to be active and performs basic health check
7. **Cleanup**: Removes temporary deployment package
8. **Reporting**: Generates comprehensive deployment summary

## Package Optimisation

The action automatically excludes the following from deployment packages:
- Test files (`__tests__`, `*.test.js`, `*.spec.js`)
- Development configuration files (`.env*`, `.eslintrc*`, `.prettierrc*`)
- Documentation (`README.md`)
- Coverage reports (`coverage`, `.nyc_output`)
- Git files (`.git`, `.github`)

## Security Features

- Uses production dependencies only
- Validates package size against AWS limits
- Supports dry-run mode for testing
- Provides detailed logging for audit trails

## Error Handling

The action includes comprehensive error handling for:
- Missing or invalid inputs
- Build failures
- Package creation issues
- Lambda deployment failures
- Function verification problems

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