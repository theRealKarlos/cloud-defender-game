# Cloud Defenders - Missile Mayhem on AWS

A tower defence-style web game where players defend cloud infrastructure components from incoming threats. Built with HTML5 Canvas and deployed on AWS serverless infrastructure.

## Project Structure

```
cloud-defenders-game/
├── frontend/                 # Frontend game code
│   ├── index.html           # Main HTML5 Canvas game page
│   ├── js/
│   │   └── game.js          # Game engine and logic
│   ├── styles/
│   │   └── game.css         # Game styling
│   └── package.json         # Frontend dependencies
├── backend/                 # Backend API code
│   ├── index.js             # Lambda function for score API
│   └── package.json         # Backend dependencies
├── infra/                   # Terraform infrastructure
│   ├── main.tf              # Main Terraform configuration
│   └── modules/
│       └── s3_game_hosting/ # S3 static hosting module
└── .kiro/specs/            # Feature specifications
    └── cloud-defenders-game/
        ├── requirements.md  # Game requirements
        ├── design.md        # Technical design
        └── tasks.md         # Implementation tasks
```

## Development Environment Setup

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

## Contributing

This project follows a spec-driven development approach. See `.kiro/specs/cloud-defenders-game/` for detailed requirements, design, and implementation tasks.

## License

MIT License - see LICENSE file for details.