# Cloud Defenders - Missile Mayhem on AWS

A tower defence-style web game where players defend cloud infrastructure components from incoming threats. Built with HTML5 Canvas and deployed on AWS serverless infrastructure.

## ⚠️ Lab Project Disclaimer

**This is an educational lab project intended for learning and demonstration purposes.** While this project aims to follow industry best practices and production-level patterns, it is provided "as-is" and should not be considered production-ready without thorough review and customisation for your specific requirements.

## ⚠️ AI Driven Development

I'm not a JavaScript developer, but I am a coder of sorts! I tend to know what good looks like, this project was built using AI prompts and a lot of trial and error.

I've strived to have the AI build a modular and secure JavaScript browser game engine, and I've tried to follow best practices for security and deployment.

I've also tried to make the code as readable as possible, and I've added a lot of comments to help explain the code.

I know what I want to achieve with this project and my aim is to have an AI build it for me with minimal manual coding.

The build pipeline was also AI generated but with a lot of guidence as to how I wanted it to work.

In essence this project is an experiment in AI driven development.

### Educational Intent

- Demonstrates modern CI/CD pipeline architecture
- Showcases AWS serverless infrastructure patterns
- Illustrates security best practices and deployment strategies
- Serves as a learning resource for cloud-native development

### Important Notes

- This project is designed for educational demonstration, not production use
- Security configurations should be reviewed and customised for production environments
- Infrastructure costs are the responsibility of the user
- No warranty or support is provided beyond educational guidance

## Project Structure

```
cloud-defenders-game/
├── frontend/                    # Frontend game code
│   ├── index.html              # Main HTML5 Canvas game page
│   ├── api-diagnostics.html    # API testing and diagnostics page
│   ├── debug.html              # Debug interface for development
│   ├── icon-test.html          # AWS icon testing interface
│   ├── js/                     # Modular game engine
│   │   ├── api-service.js      # API communication layer
│   │   ├── aws-icons.js        # AWS service icon management
│   │   ├── config.js           # Game configuration
│   │   ├── defense.js          # Tower defence mechanics
│   │   ├── entities.js         # Entity system (core game objects)
│   │   ├── event-handler.js    # Event listener management
│   │   ├── explosive-bomb.js   # Explosive weapon mechanics
│   │   ├── game-conditions.js  # Game state and conditions
│   │   ├── game-engine.js      # Main game orchestrator
│   │   ├── game-loop.js        # Frame timing and game loop
│   │   ├── game-security.js    # Security-themed game mechanics
│   │   ├── game-state.js       # Game state management
│   │   ├── game.js             # Application entry point
│   │   ├── input-manager.js    # Keyboard and mouse input
│   │   ├── missile.js          # Missile weapon system
│   │   ├── renderer.js         # Canvas rendering system
│   │   ├── target.js           # Target and enemy management
│   │   ├── ui-manager.js       # DOM UI management
│   │   └── wave-manager.js     # Wave progression system
│   ├── styles/                 # Game styling
│   │   └── game.css            # Game stylesheet
│   ├── __tests__/              # Test suite
│   ├── .prettierrc             # Prettier configuration
│   ├── eslint.config.js        # ESLint configuration
│   └── package.json            # Frontend dependencies
├── backend/                    # Backend API code
│   ├── index.js                # Lambda function entry point
│   ├── src/                    # Source code organization
│   │   ├── handlers/           # Request handlers
│   │   │   ├── scoreHandler.js # Score submission and leaderboard
│   │   │   └── healthHandler.js # Health check endpoint
│   │   ├── services/           # Business logic services
│   │   └── utils/              # Utility functions
│   ├── __tests__/              # Test suite
│   ├── .prettierrc             # Prettier configuration
│   ├── eslint.config.js        # ESLint configuration
│   └── package.json            # Backend dependencies
├── infra/                      # Terraform infrastructure
│   ├── main.tf                 # Main Terraform configuration
│   ├── variables.tf            # Variable definitions
│   ├── outputs.tf              # Output definitions
│   ├── providers.tf            # Provider configuration
│   ├── backend.tf              # Terraform backend configuration
│   ├── terraform.tf            # Terraform version constraints
│   ├── terraform.tfvars        # Variable values
│   ├── terraform.tfvars.example # Example variable file
│   ├── DEPLOYMENT.md           # Deployment documentation
│   └── modules/                # Terraform modules
│       ├── _shared_variables.tf # Shared module variables
│       ├── api_gateway/        # API Gateway module
│       ├── dynamodb/           # DynamoDB module
│       ├── lambda_function/    # Lambda function module
│       └── s3_game_hosting/    # S3 static hosting module
├── scripts/                    # Development and deployment scripts
│   ├── build/                  # Build scripts
│   │   ├── build-backend.ps1   # PowerShell build script (Windows)
│   │   └── build-backend.sh    # Bash build script (Linux CI)
│   ├── deploy/                 # Deployment scripts
│   ├── quality/                # Code quality scripts
│   ├── utils/                  # Utility scripts
│   ├── health-check.ps1        # PowerShell health check (Windows)
│   ├── health-check.sh         # Bash health check (Linux CI)
│   ├── rollback-manager.ps1    # Rollback management script
│   ├── setup-dev-env.ps1       # Development environment setup
│   └── README.md               # Scripts documentation
├── .github/                    # GitHub configuration
│   ├── workflows/              # GitHub Actions workflows
│   │   ├── main.yml            # Primary CI/CD pipeline
│   │   ├── reusable-ci.yml     # Reusable CI workflow
│   │   ├── reusable-build.yml  # Reusable build workflow
│   │   ├── reusable-deploy.yml # Reusable deploy workflow
│   │   ├── reusable-prepare-job.yml # Job preparation workflow
│   │   ├── reusable-setup-node.yml # Node.js setup workflow
│   │   ├── reusable-determine-environment.yml # Environment detection
│   │   └── reusable-setup-terraform.yml # Terraform setup workflow
│   ├── actions/                # Custom composite actions
│   └── ISSUE_TEMPLATE/         # Issue templates
├── dist/                       # Build artefacts (generated)
├── .vscode/                    # VS Code configuration
├── .gitignore                  # Git ignore rules
├── SECURITY.md                 # Security policy
└── README.md                   # Project documentation
```

## API Endpoints

The backend API provides the following endpoints:

| Method | Endpoint           | Description          | Purpose                                                                   |
| ------ | ------------------ | -------------------- | ------------------------------------------------------------------------- |
| `POST` | `/api/scores`      | Submit game score    | Allows players to submit their scores to the leaderboard                  |
| `GET`  | `/api/leaderboard` | Retrieve leaderboard | Returns top scores for display in the game                                |
| `GET`  | `/health`          | Health check         | Provides service health status for monitoring and deployment verification |

### API Response Format

All API endpoints return JSON responses with appropriate HTTP status codes and CORS headers for browser compatibility.

**Health Check Response Example:**

```json
{
  "status": "healthy",
  "message": "Backend is operational",
  "timestamp": "2024-01-01T12:00:00.000Z",
  "version": "1.0.0"
}
```

## Development Environment Setup

### Prerequisites

- Node.js (v18 or higher)
- npm (comes with Node.js)
- Git
- AWS CLI (for deployment)
- PowerShell (for Windows development)

### Testing CI Scripts Locally

This project uses cross-platform scripts to ensure compatibility between Windows development and Linux CI environments. You can test the Bash scripts locally using WSL (Windows Subsystem for Linux):

#### Prerequisites for WSL Testing

1. **Install WSL** (if not already installed):

   ```powershell
   wsl --install
   ```

2. **Install zip utility** in WSL:
   ```bash
   sudo apt update
   sudo apt install -y zip
   ```

#### Testing Bash Build Scripts

Test the backend build script that will run in CI:

```bash
# Test the Bash build script
wsl bash scripts/build/build-backend.sh

# Test via npm script
wsl bash -c "cd backend && npm run build:ci"
```

#### Testing Health Check Scripts

Test the deployment health check script:

```bash
# Test help output
wsl bash scripts/health-check.sh --help

# Test with actual URLs (replace with your deployment URLs)
wsl bash scripts/health-check.sh \
  --frontend-url "https://your-frontend-url.com" \
  --backend-url "https://your-backend-url.com"
```

#### Benefits of WSL Testing

- **Validate CI scripts locally**: Test the exact same scripts that run in GitHub Actions
- **Debug issues early**: Identify and fix problems before pushing to CI
- **Ensure cross-platform compatibility**: Verify scripts work on both Windows and Linux
- **Faster development cycle**: No need to push to CI to test script changes

### Automated Setup (Recommended)

Run the setup script as Administrator:

```cmd
scripts\setup-dev-env.bat
```

This will automatically install:

- Node.js (v22)
- Terraform (v1.12+)
- AWS CLI (v2.15+)
- Git and additional development tools
- Project dependencies

### Manual Prerequisites

If you prefer manual installation:

- Node.js (v22 or later)
- AWS CLI configured (v2.15+)
- Terraform (v1.12 or later)

### Frontend Development

```bash
cd frontend
npm install
npm run dev
```

The game will be available at `http://localhost:3000`

### Backend Development

```bash
cd backend
npm install
npm test
```

### Infrastructure Deployment

#### Prerequisites

Before deploying infrastructure, ensure you have:

1. **AWS CLI configured with SSO** (recommended) or access keys
2. **Terraform installed** (v1.12 or later)
3. **S3 bucket with Object Lock enabled** for Terraform state storage

**Important: S3 Backend Configuration Requirements**

The Terraform backend uses S3 with the `use_lockfile = true` setting, which requires:

- **S3 Versioning**: Must be enabled on the bucket to support Object Lock
- **S3 Object Lock**: Must be enabled to provide state locking functionality

**Why These Are Required:**

- **State Locking**: Prevents multiple Terraform operations from running simultaneously, which could corrupt the state file
- **Versioning**: Required by AWS to enable Object Lock features
- **Object Lock**: Provides the actual locking mechanism that prevents concurrent modifications to the state file

**Important Note:** While Terraform may work locally without these settings (due to sequential execution and shorter operation times), it will **fail in GitHub Actions runners** with `412 PreconditionFailed` errors. This is because:

- **Local Development**: Operations are sequential and typically complete quickly, reducing lock contention
- **CI/CD Environment**: Multiple concurrent runs, longer operation times, and ephemeral runners create higher lock contention
- **GitHub Actions**: Uses temporary credentials and different authentication patterns that are more sensitive to missing Object Lock configuration

Without these settings, you'll encounter `412 PreconditionFailed` errors when Terraform tries to acquire a state lock in CI/CD environments.

#### Dynamic Backend Configuration

This project uses a dynamic backend configuration approach to ensure proper environment isolation:

- **Generic Backend**: The `backend.tf` file contains a generic state file path
- **Dynamic Override**: Environment-specific paths are provided during `terraform init` using the `-backend-config` flag
- **Environment Isolation**: Each environment (dev, production) uses its own state file
- **Prevents Accidents**: Ensures deployments target the correct environment

**Local Development:**

```bash
terraform init -backend-config="key=cloud-defenders/envs/dev/terraform.tfstate"
```

**CI/CD Pipeline:**

```bash
terraform init -backend-config="key=cloud-defenders/envs/${{ inputs.environment }}/terraform.tfstate"
```

This approach follows Terraform best practices for multi-environment deployments and prevents state corruption from concurrent operations.

#### Local Development Deployment

For local development, you can use AWS SSO or a named profile:

```bash
cd infra

# Set your AWS profile (if using SSO or named profiles)
$env:AWS_PROFILE = "your-profile-name"

# Login to AWS SSO (if using SSO)
aws sso login

# Initialise Terraform with environment-specific backend
terraform init -backend-config="key=cloud-defenders/envs/dev/terraform.tfstate"

# Plan the deployment
terraform plan -var="aws_profile=your-profile-name" -var="environment=development"

# Apply the changes
terraform apply -var="aws_profile=your-profile-name" -var="environment=development"
```

**Note:** The `-backend-config` flag is required to specify the environment-specific state file. This ensures proper state isolation between environments.

#### CI/CD Deployment

The GitHub Actions pipeline automatically handles authentication using OIDC:

- **Authentication**: Uses AWS OIDC with temporary credentials
- **State Locking**: S3 Object Lock prevents concurrent modifications
- **Environment Variables**: Automatically configured by the `configure-aws-credentials` action

The pipeline will automatically:

1. Authenticate using the configured IAM role
2. Initialize Terraform with the S3 backend
3. Plan and apply changes with proper state locking
4. Update frontend configuration with the correct API Gateway URL for the target environment
5. Deploy both infrastructure and application components
6. Perform health checks on both frontend and backend services

## Game Features

- **HTML5 Canvas**: Smooth 60fps gameplay
- **AWS-themed**: Defend S3, Lambda, RDS, and EC2 services
- **Tower Defence**: Strategic countermeasure deployment
- **Progressive Waves**: Increasing difficulty with new threat types
- **Power-ups**: Auto-scaling, IAM lockdown, budget alerts
- **Leaderboard**: Score persistence and competition
- **Chaos Mode**: Advanced difficulty with random events

## CI/CD Pipeline Best Practices

This project implements a comprehensive CI/CD pipeline using GitHub Actions with the following best practices:

### Architecture

The pipeline is built using **reusable workflows** for modularity and maintainability:

- **`main.yml`**: Primary entry point that orchestrates the entire pipeline
- **`reusable-ci.yml`**: Handles linting, testing, and security scanning
- **`reusable-build.yml`**: Builds application artefacts
- **`reusable-deploy.yml`**: Deploys infrastructure and applications

### Security Features

- **OIDC Authentication**: Uses AWS OIDC for secure credential management
- **Minimal Permissions**: Granular permission scoping for each job
- **Security Scanning**: CodeQL, dependency review, and npm audit
- **Infrastructure Security**: tfsec and Checkov for IaC security scanning
- **Cost Analysis**: Infracost integration for cost estimation on pull requests
- **API throttling**: Stage-level defaults and stricter per-route limits (e.g., tighter limits for `POST /api/scores`) to reduce abuse and smooth bursts (HTTP API)
- **CloudFront security headers**: Response headers policy adds HSTS, X-Frame-Options, X-Content-Type-Options (nosniff), Referrer-Policy, Permissions-Policy, and a minimal CSP for defense-in-depth

#### Security baseline (lab)

This lab includes a pragmatic baseline to improve security with low complexity:

- **API Gateway throttling (HTTP API)**

  - Stage defaults limit overall request rate and bursts across all clients
  - Stricter throttling on sensitive endpoints like `POST /api/scores`
  - Note: This is coarse-grained (not per-IP). For production, prefer AWS WAFv2 for IP-aware rate limiting and managed rules

- **CloudFront response headers policy**
  - Adds standard security headers: `Strict-Transport-Security`, `X-Frame-Options`, `X-Content-Type-Options`, `Referrer-Policy`, `Permissions-Policy`, and `X-XSS-Protection` (legacy browsers)
  - **Minimal CSP** tailored for the game:
    - `default-src 'self'`; `img-src 'self' data:`; `style-src 'self' 'unsafe-inline'`; `script-src 'self'`
    - `connect-src 'self' https://*.execute-api.eu-west-2.amazonaws.com` to allow API calls
    - `frame-ancestors 'none'`, `base-uri 'self'`, `form-action 'self'`
  - Adjust CSP if you add third‑party scripts, fonts, or change API endpoints. For production, narrow `connect-src` to the exact API host

### Deployment Strategy

- **Environment Separation**: Development and production environments with proper isolation
- **Dynamic Configuration**: Frontend API configuration is automatically updated during deployment to target the correct environment's API Gateway URL
- **Automated Rollback**: Lambda deployment includes automatic rollback on verification failure
- **Targeted Cache Invalidation**: CloudFront invalidation only for HTML files, not all assets
- **Health Checks**: Post-deployment verification for both frontend and backend using the `/health` endpoint

### Rollback Strategy

The pipeline implements a robust rollback strategy for both frontend and backend deployments:

#### Backend Rollback (Lambda)

- **Lambda Aliases**: Uses the `live` alias to manage traffic routing
- **Version Management**: Each deployment creates a new Lambda version
- **Atomic Updates**: Alias is updated to point to the new version
- **Automatic Rollback**: If health checks fail, the alias is reverted to the previous version
- **Zero Downtime**: Traffic is instantly shifted between versions

#### Frontend Rollback (S3 + CloudFront)

- **Versioned Deployments**: Each deployment creates a timestamped folder in S3 (e.g., `/v20231201-12345678/`)
- **Origin Path Updates**: CloudFront origin path is updated to point to the new version folder
- **Instant Rollback**: If deployment fails, origin path is reverted to the previous version
- **No Data Loss**: Previous versions remain available in S3

#### Manual Rollback

Use the rollback manager script for manual rollbacks:

```powershell
# Rollback backend to specific version
.\scripts\rollback-manager.ps1 -Component "backend" -Environment "production" -FunctionName "my-function" -PreviousVersion "5"

# Rollback frontend to specific origin path
.\scripts\rollback-manager.ps1 -Component "frontend" -Environment "production" -CloudFrontDistributionId "E123456789" -PreviousOriginPath "/v20231201-12345678"

# Rollback both components
.\scripts\rollback-manager.ps1 -Component "both" -Environment "production" -FunctionName "my-function" -PreviousVersion "5" -CloudFrontDistributionId "E123456789" -PreviousOriginPath "/v20231201-12345678"
```

### Best Practices for Production

> **⚠️ Security Recommendation**: For production environments, all GitHub Actions should be pinned to specific commit SHAs to prevent supply-chain attacks. This practice has been omitted from this lab project for flexibility, but should be implemented in real production systems.

Example of pinning actions to commit SHAs:

```yaml
- uses: actions/checkout@v4
  # Should be:
  # uses: actions/checkout@a4a900b32bb1ae2e4b6d4c1a9c3e4f5a6b7c8d9e
```

### Pipeline Flow

1. **CI Phase**: Parallel execution of linting, testing, and security scanning
2. **Build Phase**: Creation of deployment artefacts with checksums
3. **Deploy Phase**: Infrastructure validation, cost analysis, and application deployment
4. **Verification**: Health checks and automated rollback on failure

### Custom Actions

The pipeline uses custom composite actions for deployment:

- **`deploy-frontend`**: Deploys to S3 with CloudFront invalidation
- **`deploy-backend`**: Deploys to Lambda with rollback capabilities

These actions are designed to be lightweight and expect pre-built artefacts rather than performing builds themselves.

## Technology Stack

- **Frontend**: HTML5 Canvas, Vanilla JavaScript
- **Backend**: AWS Lambda (Node.js), API Gateway
- **Database**: DynamoDB with on-demand billing
- **Hosting**: S3 Static Website, CloudFront CDN
- **Infrastructure**: Terraform modules
- **CI/CD**: GitHub Actions

## Getting Started

1. Clone the repository
2. Set up the development environment (see above)
3. Run the frontend locally: `cd frontend && npm run dev`
4. Open `http://localhost:3000` in your browser
5. Click "Start Game" to begin defending your cloud infrastructure!

## Cost Estimation Setup

The CI/CD pipeline includes automated cost estimation using Infracost. This provides cost estimates for infrastructure changes before they are deployed.

### Setting Up Infracost API Key

To enable cost estimation in pull requests, you need to configure an Infracost API key:

#### Step 1: Install and Register with Infracost

1. **Install Infracost on Windows:**

   ```powershell
   winget install --id Infracost.Infracost
   ```

   _(Alternative: Download from [infracost.io](https://www.infracost.io/docs/installation/) if winget is unavailable)_

2. **Authenticate with Infracost Cloud:**
   ```powershell
   infracost auth login
   ```
   This will open a browser window to create a free account or log in.

#### Step 2: Retrieve Your API Key

After authentication, get your API key:

```powershell
infracost configure get api_key
```

#### Step 3: Add to GitHub Secrets

1. Go to your GitHub repository
2. Navigate to **Settings** > **Secrets and variables** > **Actions**
3. Click **New repository secret**
4. Enter:
   - **Name:** `INFRACOST_API_KEY`
   - **Secret:** Paste your API key from Step 2
5. Click **Add secret**

Once configured, cost estimates will appear as comments on pull requests that include infrastructure changes.

## Troubleshooting

### Common Authentication Issues

#### AWS SSO Authentication Errors

If you encounter authentication errors with Terraform when using AWS SSO:

```powershell
# Set the AWS profile environment variable
$env:AWS_PROFILE = "your-profile-name"

# Login to AWS SSO
aws sso login

# Then run Terraform commands
terraform init
terraform plan
```

#### State Lock Errors

If you encounter state lock errors in CI/CD:

1. **Check S3 Object Lock**: Ensure your S3 bucket has Object Lock enabled
2. **Force Unlock**: If a stale lock exists, use `terraform force-unlock <lock-id>` locally
3. **Verify Permissions**: Ensure the IAM role has proper S3 permissions

#### GitHub Actions Authentication Failures

If the pipeline fails with "Could not load credentials":

1. **Check Secret Configuration**: Ensure `AWS_ROLE_TO_ASSUME` is set as a repository secret
2. **Verify IAM Trust Policy**: Confirm the role's trust policy allows GitHub Actions
3. **Check OIDC Provider**: Ensure the GitHub OIDC provider is configured in AWS

### Local Development Issues

#### Frontend Configuration

The frontend configuration (`frontend/js/config.js`) is automatically updated during CI/CD deployment to use the correct API Gateway URL for each environment. For local development:

1. **Development Environment**: The default configuration points to the development API
2. **Manual Updates**: Use the update scripts in `scripts/utils/` to update the configuration locally:
   ```bash
   # Update configuration from Terraform outputs
   bash scripts/utils/update-api-config.sh
   ```

#### PowerShell Environment Variables

When using PowerShell, set environment variables with:

```powershell
$env:AWS_PROFILE = "your-profile-name"
```

#### Terraform Variable Passing

For local development, pass the AWS profile variable:

```powershell
terraform plan -var="aws_profile=your-profile-name" -var="environment=development"
```

## License

MIT License - see LICENSE file for details.
