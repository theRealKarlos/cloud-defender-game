# GitHub Actions Configuration

This directory contains the GitHub Actions workflows and custom actions for the Cloud Defenders project.

## Directory Structure

```
.github/
├── workflows/           # GitHub Actions workflow files
│   └── _template.yml   # Template for creating new workflows
├── actions/            # Custom GitHub Actions
├── shared-config.md    # Shared configuration and common settings
├── ISSUE_TEMPLATE/     # Issue templates for bug reports, features, etc.
│   ├── bug_report.yml
│   ├── feature_request.yml
│   ├── security_issue.yml
│   └── config.yml
├── pull_request_template.md # Pull request template
└── README.md          # This file
```

## Workflows

### Planned Workflows

The following workflows will be implemented as part of the CI/CD pipeline:

- **ci.yml** - Main continuous integration pipeline
- **cd-staging.yml** - Staging deployment workflow
- **cd-production.yml** - Production deployment workflow  
- **preview-environment.yml** - Feature branch preview environments
- **security-scan.yml** - Comprehensive security scanning
- **cleanup.yml** - Environment and artefact cleanup

### Shared Configuration

The `shared-config.md` file contains common environment variables and reusable job configurations:

- Node.js version: 22
- Terraform version: 1.12
- AWS region: eu-west-2
- Artefact retention: 30 days

## Custom Actions

Custom actions will be created in the `actions/` directory:

- **setup-node/** - Node.js setup with caching
- **setup-terraform/** - Terraform setup and configuration
- **deploy-frontend/** - Frontend deployment to S3/CloudFront
- **deploy-backend/** - Backend deployment to Lambda

## Issue Templates

Issue templates are configured to help contributors provide structured information:

- **Bug Report** - For reporting bugs and issues
- **Feature Request** - For suggesting new features
- **Security Issue** - For non-sensitive security concerns

For sensitive security vulnerabilities, use GitHub's private vulnerability reporting feature.

## Pull Request Template

The pull request template ensures all necessary information is provided:

- Description of changes
- Type of change (bug fix, feature, etc.)
- Testing checklist
- Security considerations
- Infrastructure impact

## Best Practices

### Workflow Development

1. Use the `_template.yml` as a starting point for new workflows
2. Follow British English spelling in all documentation
3. Use explicit permissions for security
4. Implement proper caching strategies
5. Use environment-specific configurations

### Security

1. Use OIDC for AWS authentication instead of long-lived keys
2. Store sensitive data in GitHub Secrets
3. Implement least-privilege access
4. Regular security scanning and dependency updates

### Performance

1. Use caching for dependencies and build artefacts
2. Run jobs in parallel where possible
3. Use appropriate runners for different workloads
4. Implement conditional job execution

## Environment Variables

Common environment variables used across workflows:

| Variable | Value | Description |
|----------|-------|-------------|
| `NODE_VERSION` | 22 | Node.js version for all jobs |
| `TERRAFORM_VERSION` | 1.12 | Terraform version for infrastructure jobs |
| `AWS_REGION` | eu-west-2 | Primary AWS region |
| `ARTIFACT_RETENTION_DAYS` | 30 | Days to retain build artefacts |

## Contributing

When adding new workflows or modifying existing ones:

1. Follow the established patterns and conventions
2. Update this README if adding new workflows or actions
3. Test workflows thoroughly before merging
4. Ensure proper error handling and notifications
5. Use British English spelling throughout

## Support

For questions about the CI/CD pipeline or GitHub Actions configuration:

1. Check the project documentation
2. Review existing workflows and templates
3. Create an issue using the appropriate template
4. Participate in project discussions