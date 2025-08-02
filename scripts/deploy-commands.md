# Deployment Commands

## Deploy Everything Except CloudFront

### Option 1: Single Command
```powershell
cd infra
terraform apply -target=module.dynamodb -target=module.lambda_function -target=module.api_gateway -auto-approve
```

### Option 2: Interactive (Review Before Apply)
```powershell
cd infra
terraform apply -target=module.dynamodb -target=module.lambda_function -target=module.api_gateway
```

## Deploy CloudFront Later

```powershell
cd infra
terraform apply -target=module.s3_game_hosting
```

## Deploy Everything (Full Infrastructure)

```powershell
cd infra
terraform apply
```

## Useful Commands

### Plan Only (See What Will Be Created)
```powershell
terraform plan -target=module.dynamodb -target=module.lambda_function -target=module.api_gateway
```

### Check Current State
```powershell
terraform show
```

### List All Resources
```powershell
terraform state list
```