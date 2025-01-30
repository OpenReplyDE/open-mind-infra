import * as cdk from "aws-cdk-lib";
import * as ec2 from "aws-cdk-lib/aws-ec2";
import * as ecs from "aws-cdk-lib/aws-ecs";
import * as ecs_patterns from "aws-cdk-lib/aws-ecs-patterns";
import * as ecr from "aws-cdk-lib/aws-ecr";
import * as secretsmanager from "aws-cdk-lib/aws-secretsmanager";

const ECR_REPO = "openmind";
const SECRET = "openmind";
const IMAGE_TAG = "bd68dfce2ec3bad2507ce9611e3710333fc8966f";

export class OpenMindInfraStack extends cdk.Stack {
  constructor(scope: cdk.App, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const vpc = new ec2.Vpc(this, "OpenMindVPC", {
      maxAzs: 2,
    });

    const cluster = new ecs.Cluster(this, "OpenMindFargateCluster", {
      vpc: vpc,
    });

    const ecrRepository = ecr.Repository.fromRepositoryName(
      this,
      "OpenMindECR",
      ECR_REPO
    );

    const taskDefinition = new ecs.FargateTaskDefinition(this, "TaskDef", {
      cpu: 2048, // 2 vCPUs
      memoryLimitMiB: 4096, // 4 GB
    });

    const secrets = secretsmanager.Secret.fromSecretNameV2(
      this,
      "OpenMindSecrets",
      SECRET
    );

    // Add a container to the task definition using the ECR image
    taskDefinition.addContainer("WebContainer", {
      image: ecs.ContainerImage.fromEcrRepository(ecrRepository, IMAGE_TAG),
      portMappings: [{ containerPort: 3000 }],
      secrets: {
        JIRA_API_KEY: ecs.Secret.fromSecretsManager(secrets, "JIRA_API_KEY"),
        CONFLUENCE_USERNAME: ecs.Secret.fromSecretsManager(
          secrets,
          "CONFLUENCE_USERNAME"
        ),
        CONFLUENCE_SPACE_KEY: ecs.Secret.fromSecretsManager(
          secrets,
          "CONFLUENCE_SPACE_KEY"
        ),
        HF_API_TOKEN: ecs.Secret.fromSecretsManager(secrets, "HF_API_TOKEN"),
        SLACK_BOT_TOKEN: ecs.Secret.fromSecretsManager(
          secrets,
          "SLACK_BOT_TOKEN"
        ),
        SLACK_SIGNING_SECRET: ecs.Secret.fromSecretsManager(
          secrets,
          "SLACK_SIGNING_SECRET"
        ),
        INIT_TOKEN: ecs.Secret.fromSecretsManager(secrets, "INIT_TOKEN"),
      },
      logging: ecs.LogDrivers.awsLogs({
        streamPrefix: "OpenMindAppContainer",
        logRetention: cdk.aws_logs.RetentionDays.ONE_WEEK,
      }),
    });

    const fargateService =
      new ecs_patterns.ApplicationLoadBalancedFargateService(
        this,
        "OpenMindFargateService",
        {
          cluster: cluster,
          taskDefinition: taskDefinition,
          desiredCount: 1,
          publicLoadBalancer: true,
          listenerPort: 80,
          circuitBreaker: { rollback: true },
          ephemeralStorageGiB: 46,
          minHealthyPercent: 100,
          maxHealthyPercent: 200,
          healthCheck: {
            command: [
              "CMD-SHELL",
              "curl -f http://localhost:3000/health || exit 1",
            ],
            interval: cdk.Duration.seconds(300),
            timeout: cdk.Duration.seconds(60),
            retries: 3,
            startPeriod: cdk.Duration.minutes(5),
          },
        }
      );

    // Configure health checks for the ALB
    fargateService.targetGroup.configureHealthCheck({
      path: "/health",
      interval: cdk.Duration.seconds(300),
      timeout: cdk.Duration.seconds(60),
    });

    // Output the ALB DNS name
    new cdk.CfnOutput(this, "OpenMindLoadBalancerDNS", {
      value: fargateService.loadBalancer.loadBalancerDnsName,
    });
  }
}

const app = new cdk.App();
new OpenMindInfraStack(app, "OpenMindInfraStack");
