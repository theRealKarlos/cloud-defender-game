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
│   ├── js/                     # Modular game engine
│   │   ├── entities.js         # Entity system (core game objects)
│   │   ├── input-manager.js    # Keyboard and mouse input
│   │   ├── game-state.js       # Game state management
│   │   ├── renderer.js         # Canvas rendering system
│   │   ├── ui-manager.js       # DOM UI management
│   │   ├── game-loop.js        # Frame timing and game loop
│   │   ├── event-handler.js    # Event listener management
│   │   ├── game-engine.js      # Main game orchestrator
│   │   └── game.js             # Application entry point
│   ├── tests/                  # Test suite
│   │   ├── entity.test.js      # Entity system tests
│   │   └── README.md           # Testing documentation
│   ├── styles/
│   │   └── game.css            # Game styling
│   ├── eslint.config.js        # ESLint configuration
│   └── package.json            # Frontend dependencies
├── backend/                    # Backend API code
│   ├── index.js                # Lambda function for score API
│   └── package.json            # Backend dependencies
├── infra/                      # Terraform infrastructure
│   ├── main.tf                 # Main Terraform configuration
│   └── modules/
│       └── s3_game_hosting/    # S3 static hosting module
└── scripts/                    # Development scripts
    └── setup-dev-env.ps1       # Automated environment setup
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

```bash
cd infra
terraform init
terraform plan
terraform apply
```

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

### Deployment Strategy

- **Environment Separation**: Development and production environments with proper isolation
- **Automated Rollback**: Lambda deployment includes automatic rollback on verification failure
- **Targeted Cache Invalidation**: CloudFront invalidation only for HTML files, not all assets
- **Health Checks**: Post-deployment verification for both frontend and backend

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

## License

MIT License - see LICENSE file for details.
