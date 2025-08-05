# YAML Validation for GitHub Actions

## Overview

YAML validation is a critical step when developing GitHub Actions to ensure the action definition files are syntactically correct and will be properly parsed by GitHub's workflow engine.

## Validation Methods

### Python YAML Validation

We attempted to validate the `action.yml` file using Python's `yaml` library:

```bash
python -c "import yaml; yaml.safe_load(open('.github/actions/deploy-frontend/action.yml')); print('YAML syntax is valid')"
```

**What this does:**
- Imports Python's `yaml` library
- Uses `yaml.safe_load()` to parse the YAML file
- If parsing succeeds without exceptions, the YAML is syntactically valid
- If parsing fails, it indicates syntax errors in the YAML

### Why This Validation Failed

The validation command failed in our environment, likely due to:
1. **Missing PyYAML library** - The `yaml` module may not be installed
2. **Python environment issues** - Python may not be available or configured properly
3. **File path issues** - The file path might not be accessible from the current context

## Alternative Validation Methods

### 1. GitHub Actions Workflow Validation

The most reliable validation is through GitHub itself:

```yaml
name: Validate Actions
on: [push, pull_request]

jobs:
  validate:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Validate action.yml
        run: |
          # GitHub automatically validates action.yml syntax when the workflow runs
          echo "Action validation will occur when workflow executes"
```

### 2. Local YAML Linting Tools

**Using yamllint (Python-based):**
```bash
pip install yamllint
yamllint .github/actions/deploy-frontend/action.yml
```

**Using yq (Go-based):**
```bash
yq eval '.name' .github/actions/deploy-frontend/action.yml
```

**Using Node.js yaml package:**
```bash
npm install -g yaml
node -e "console.log(require('yaml').parse(require('fs').readFileSync('.github/actions/deploy-frontend/action.yml', 'utf8')))"
```

### 3. IDE Integration

Most modern IDEs provide YAML validation:
- **VS Code**: YAML extension with schema validation
- **IntelliJ/WebStorm**: Built-in YAML support
- **Vim/Neovim**: YAML syntax plugins

## Why YAML Validation Matters

### 1. **Syntax Errors Prevention**
```yaml
# Invalid YAML - missing quotes around value with special characters
name: Deploy Frontend: S3 & CloudFront  # ❌ Colon in unquoted string

# Valid YAML
name: "Deploy Frontend: S3 & CloudFront"  # ✅ Properly quoted
```

### 2. **Indentation Issues**
```yaml
# Invalid YAML - inconsistent indentation
inputs:
  s3-bucket:
    description: "S3 bucket name"
   required: true  # ❌ Wrong indentation

# Valid YAML
inputs:
  s3-bucket:
    description: "S3 bucket name"
    required: true  # ✅ Consistent indentation
```

### 3. **Data Type Validation**
```yaml
# Invalid YAML - boolean as unquoted string
inputs:
  dry-run:
    required: yes  # ❌ Should be boolean

# Valid YAML
inputs:
  dry-run:
    required: true  # ✅ Proper boolean value
```

### 4. **GitHub Actions Schema Compliance**

GitHub Actions have specific schema requirements:

```yaml
# Required top-level fields
name: "Action Name"           # ✅ Required
description: "Description"    # ✅ Required
author: "Author Name"         # ✅ Optional but recommended

# Valid runs configuration
runs:
  using: "composite"          # ✅ Required for composite actions
  steps:                      # ✅ Required for composite actions
    - name: "Step name"
      shell: bash
      run: echo "Hello"
```

## Common YAML Errors in GitHub Actions

### 1. **Missing Required Fields**
```yaml
# ❌ Missing 'runs' section
name: "My Action"
description: "Does something"
inputs:
  my-input:
    description: "Input description"
# Missing runs section will cause action to fail
```

### 2. **Invalid Step References**
```yaml
# ❌ Invalid step output reference
outputs:
  result:
    value: ${{ steps.nonexistent-step.outputs.value }}  # Step doesn't exist
```

### 3. **Incorrect Shell Specification**
```yaml
# ❌ Invalid shell for composite action
runs:
  using: "composite"
  steps:
    - name: "Run command"
      run: echo "Hello"  # Missing shell specification
```

### 4. **Malformed Input/Output Definitions**
```yaml
# ❌ Missing required description
inputs:
  my-input:
    required: true  # Missing description field

# ✅ Correct format
inputs:
  my-input:
    description: "Input description"
    required: true
```

## Best Practices for YAML Validation

### 1. **Pre-commit Validation**
Set up pre-commit hooks to validate YAML before commits:

```yaml
# .pre-commit-config.yaml
repos:
  - repo: https://github.com/adrienverge/yamllint
    rev: v1.32.0
    hooks:
      - id: yamllint
        files: \.ya?ml$
```

### 2. **CI/CD Pipeline Validation**
Include YAML validation in your CI pipeline:

```yaml
name: Validate
on: [push, pull_request]
jobs:
  validate-yaml:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Validate YAML files
        run: |
          find .github -name "*.yml" -o -name "*.yaml" | xargs yamllint
```

### 3. **Schema Validation**
Use JSON Schema validation for GitHub Actions:

```bash
# Using ajv-cli with GitHub Actions schema
npm install -g ajv-cli
ajv validate -s github-action-schema.json -d .github/actions/*/action.yml
```

### 4. **Testing Actions Locally**
Use tools like `act` to test actions locally:

```bash
# Install act
curl https://raw.githubusercontent.com/nektos/act/master/install.sh | sudo bash

# Test action locally
act -j test-action
```

## Validation Checklist

Before deploying GitHub Actions, ensure:

- [ ] **YAML syntax is valid** (no parsing errors)
- [ ] **Required fields are present** (name, description, runs)
- [ ] **Input/output definitions are complete** (descriptions, types)
- [ ] **Step references are correct** (step IDs match outputs)
- [ ] **Shell specifications are included** (for composite actions)
- [ ] **File paths are correct** (relative to repository root)
- [ ] **Environment variables are properly referenced**
- [ ] **Secrets and inputs are correctly accessed**

## Troubleshooting YAML Issues

### Common Error Messages

**"Invalid workflow file"**
- Check YAML syntax and indentation
- Verify required fields are present
- Ensure proper quoting of strings with special characters

**"Step reference not found"**
- Verify step IDs match between steps and outputs
- Check that referenced steps actually exist
- Ensure step IDs are valid (no spaces, special characters)

**"Invalid action"**
- Confirm action.yml is in the correct location
- Verify runs.using field is specified correctly
- Check that all required inputs have descriptions

## Conclusion

YAML validation is essential for reliable GitHub Actions development. While our Python validation attempt failed due to environment constraints, multiple alternative methods exist to ensure YAML correctness. Regular validation prevents deployment failures and ensures actions work as expected in GitHub's environment.

The key is to establish a validation workflow that fits your development environment and catches errors before they reach production workflows.