# Welcome to your CDK TypeScript project

This is a blank project for CDK development with TypeScript.

The `cdk.json` file tells the CDK Toolkit how to execute your app.

## Useful commands

* `npm run build`   compile typescript to js
* `npm run watch`   watch for changes and compile
* `npm run test`    perform the jest unit tests
* `npx cdk deploy`  deploy this stack to your default AWS account/region
* `npx cdk diff`    compare deployed stack with current state
* `npx cdk synth`   emits the synthesized CloudFormation template

# OpenMind Infrastructure

This repository contains the AWS CDK infrastructure code for deploying the OpenMind application using AWS Fargate.

## Architecture Overview

The infrastructure consists of:
- VPC with 1 Availability Zone
- ECS Fargate Cluster
- Application Load Balancer
- ECS Service with Fargate Tasks
- AWS Secrets Manager for sensitive configuration
- ECR Repository integration

## Prerequisites

- AWS Account and configured credentials
- Node.js (v14.x or later)
- AWS CDK CLI
- Docker (for building and pushing container images)
- AWS CLI

## Environment Setup

1. Install AWS CLI:
```bash
curl "https://awscli.amazonaws.com/awscli-exe-linux-x86_64.zip" -o "awscliv2.zip"
unzip awscliv2.zip
sudo ./aws/install
```

2. Configure AWS credentials:
```bash
aws configure
```

3. Install AWS CDK CLI:
```bash
npm install -g aws-cdk
```

## Project Setup

1. Clone the repository:
```bash
git clone <repository-url>
cd openmind-infra
```

2. Install dependencies:
```bash
npm install
```

## Configuration

### Secrets
The application requires the following secrets to be configured in AWS Secrets Manager under the name `openmind`:

- JIRA_API_KEY
- CONFLUENCE_USERNAME
- CONFLUENCE_SPACE_KEY
- HF_API_TOKEN
- SLACK_BOT_TOKEN
- SLACK_SIGNING_SECRET

Create secrets using AWS CLI:
```bash
aws secretsmanager create-secret --name openmind --secret-string '{
  "JIRA_API_KEY":"your-jira-api-key",
  "CONFLUENCE_USERNAME":"your-confluence-username",
  "CONFLUENCE_SPACE_KEY":"your-confluence-space-key",
  "HF_API_TOKEN":"your-hf-api-token",
  "SLACK_BOT_TOKEN":"your-slack-bot-token",
  "SLACK_SIGNING_SECRET":"your-slack-signing-secret"
}'
```

### ECR Repository
The application expects a Docker image to be available in the ECR repository:
`797502124494.dkr.ecr.eu-central-1.amazonaws.com/openmind`

## Deployment

1. Bootstrap CDK (first time only):
```bash
cdk bootstrap
```

2. Deploy the stack:
```bash
cdk deploy
```

3. To destroy the stack:
```bash
cdk destroy
```

## Infrastructure Details

### VPC Configuration
- Single Availability Zone setup
- Public and private subnets

### ECS Configuration
- Fargate launch type
- 2 vCPUs
- 512 MiB memory
- Service with minimum 100% health
- Application Load Balancer with health checks

### Container Configuration
- Port 80 exposed
- Environment variables loaded from Secrets Manager
- Health check on root path ('/')

## Monitoring

- Health checks configured on ALB target group
- Interval: 60 seconds
- Timeout: 5 seconds
- Path: "/"

## Outputs

After deployment, the stack outputs:
- Load Balancer DNS name for accessing the application

## Troubleshooting

1. Check ECS service events:
```bash
aws ecs describe-services --cluster <cluster-name> --services <service-name>
```

2. View container logs:
```bash
aws logs get-log-events --log-group-name /ecs/<service-name>
```

3. Common issues:
   - Health check failures: Verify the application is responding on port 80
   - Secret access: Ensure IAM roles have proper permissions
   - Container startup: Check ECS task definitions and container logs

## Security

- Secrets are managed through AWS Secrets Manager
- IAM roles are created automatically by CDK
- VPC security groups control network access

## Contributing

1. Fork the repository
2. Create a feature branch
3. Submit a pull request

## License



