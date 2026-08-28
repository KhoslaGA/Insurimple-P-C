###############################################################################
# apps/api on ECS Fargate, ca-central-1, same VPC as the database.
#
# Co-location is not a preference. A single request makes several round trips —
# the auth guard resolves a tenant, then every query opens a transaction and
# calls set_config before doing any work. Across regions that is tens of
# milliseconds per request spent on the wire; in the same VPC it is under one.
#
# Fargate rather than App Runner: App Runner is closed to new customers, so it
# is not a path however convenient it looks in the docs.
###############################################################################

resource "aws_ecs_cluster" "main" {
  name = "insurimple-${var.environment}"

  setting {
    name  = "containerInsights"
    value = "enabled"
  }
}

resource "aws_cloudwatch_log_group" "api" {
  name              = "/ecs/insurimple-api-${var.environment}"
  retention_in_days = 90
  kms_key_id        = aws_kms_key.main.arn
}

###############################################################################
# Roles
#
# TWO roles, and the split matters. The EXECUTION role is what Fargate itself
# uses to pull the image and fetch secrets before the container starts. The TASK
# role is what the running application holds. The application never needs to
# read the master database credential, so it must not be able to — that is the
# credential that can run DDL and drop the policies protecting every tenant.
###############################################################################

data "aws_iam_policy_document" "ecs_assume" {
  statement {
    effect  = "Allow"
    actions = ["sts:AssumeRole"]
    principals {
      type        = "Service"
      identifiers = ["ecs-tasks.amazonaws.com"]
    }
  }
}

resource "aws_iam_role" "execution" {
  name               = "insurimple-api-execution-${var.environment}"
  assume_role_policy = data.aws_iam_policy_document.ecs_assume.json
}

resource "aws_iam_role_policy_attachment" "execution_managed" {
  role       = aws_iam_role.execution.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AmazonECSTaskExecutionRolePolicy"
}

# The app secret ONLY. Naming the ARN rather than a wildcard is the difference
# between "the API can read its own password" and "the API can read every
# secret in the account, including the one that owns the schema".
data "aws_iam_policy_document" "execution_secrets" {
  statement {
    effect    = "Allow"
    actions   = ["secretsmanager:GetSecretValue"]
    resources = [aws_secretsmanager_secret.db_app.arn]
  }
  statement {
    effect    = "Allow"
    actions   = ["kms:Decrypt"]
    resources = [aws_kms_key.main.arn]
  }
}

resource "aws_iam_role_policy" "execution_secrets" {
  role   = aws_iam_role.execution.id
  policy = data.aws_iam_policy_document.execution_secrets.json
}

resource "aws_iam_role" "task" {
  name               = "insurimple-api-task-${var.environment}"
  assume_role_policy = data.aws_iam_policy_document.ecs_assume.json
}

# The running application writes ai_action Parquet to the training bucket and
# nothing else. It has NO access to the archive bucket: those objects are under
# Object Lock in COMPLIANCE mode and are written by the backup job, not by the
# API. An application that can write the evidence archive can also fill it.
data "aws_iam_policy_document" "task" {
  statement {
    effect    = "Allow"
    actions   = ["s3:PutObject", "s3:AbortMultipartUpload"]
    resources = ["${aws_s3_bucket.training.arn}/*"]
  }
  statement {
    effect    = "Allow"
    actions   = ["kms:GenerateDataKey", "kms:Decrypt"]
    resources = [aws_kms_key.main.arn]
  }
}

resource "aws_iam_role_policy" "task" {
  role   = aws_iam_role.task.id
  policy = data.aws_iam_policy_document.task.json
}

###############################################################################
# Task definition
###############################################################################

resource "aws_ecs_task_definition" "api" {
  family                   = "insurimple-api-${var.environment}"
  requires_compatibilities = ["FARGATE"]
  network_mode             = "awsvpc"
  cpu                      = var.api_cpu
  memory                   = var.api_memory
  execution_role_arn       = aws_iam_role.execution.arn
  task_role_arn            = aws_iam_role.task.arn

  runtime_platform {
    operating_system_family = "LINUX"
    cpu_architecture        = "ARM64" # matches db.t4g; Graviton is cheaper per vCPU
  }

  container_definitions = jsonencode([{
    name      = "api"
    image     = var.api_image
    essential = true

    portMappings = [{
      containerPort = var.api_port
      protocol      = "tcp"
    }]

    environment = [
      { name = "NODE_ENV", value = "production" },
      { name = "PORT", value = tostring(var.api_port) },
      # DB_SET_ROLE is deliberately absent. It exists so a DEV superuser
      # connection can drop to the app role; in production the credential IS
      # insurimple_app, and setting this would mean the topology is wrong.
    ]

    # Injected by Fargate from Secrets Manager, never baked into the image and
    # never visible in the task definition.
    secrets = [
      { name = "DATABASE_URL", valueFrom = "${aws_secretsmanager_secret.db_app.arn}:url::" },
      { name = "CLERK_SECRET_KEY", valueFrom = aws_secretsmanager_secret.clerk.arn },
    ]

    logConfiguration = {
      logDriver = "awslogs"
      options = {
        "awslogs-group"         = aws_cloudwatch_log_group.api.name
        "awslogs-region"        = var.region
        "awslogs-stream-prefix" = "api"
      }
    }

    healthCheck = {
      # /health is the one route the auth guard lets through unauthenticated,
      # which is what makes it usable as a liveness probe at all.
      command     = ["CMD-SHELL", "node -e \"fetch('http://localhost:${var.api_port}/health').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))\""]
      interval    = 30
      timeout     = 5
      retries     = 3
      startPeriod = 30
    }
  }])
}

resource "aws_secretsmanager_secret" "clerk" {
  name       = "insurimple/${var.environment}/clerk/secret-key"
  kms_key_id = aws_kms_key.main.arn
}

# Deliberately no secret_version: the Clerk key is pasted in by a human, once.
# Putting it in Terraform would write it to state in plaintext.
resource "aws_secretsmanager_secret_version" "clerk_placeholder" {
  secret_id     = aws_secretsmanager_secret.clerk.id
  secret_string = "REPLACE-ME-IN-THE-CONSOLE"
  lifecycle {
    ignore_changes = [secret_string]
  }
}

###############################################################################
# Load balancer
###############################################################################

resource "aws_lb" "api" {
  name               = "insurimple-api-${var.environment}"
  load_balancer_type = "application"
  security_groups    = [aws_security_group.alb.id]
  subnets            = aws_subnet.public[*].id

  drop_invalid_header_fields = true
  enable_deletion_protection = true
}

resource "aws_lb_target_group" "api" {
  name        = "insurimple-api-${var.environment}"
  port        = var.api_port
  protocol    = "HTTP"
  vpc_id      = aws_vpc.main.id
  target_type = "ip"

  health_check {
    path                = "/health"
    matcher             = "200"
    interval            = 30
    healthy_threshold   = 2
    unhealthy_threshold = 3
  }

  # Long enough for an in-flight transaction to finish. A deregistration that
  # cuts a connection mid-transaction rolls it back — correct, but it surfaces
  # to a broker as a failed save.
  deregistration_delay = 30
}

resource "aws_acm_certificate" "api" {
  domain_name       = var.api_domain
  validation_method = "DNS"

  lifecycle {
    create_before_destroy = true
  }
}

# HTTPS only. TLS1.2 as the floor — TLS 1.0/1.1 are not acceptable for a
# connection carrying client PII and a session token.
resource "aws_lb_listener" "https" {
  load_balancer_arn = aws_lb.api.arn
  port              = 443
  protocol          = "HTTPS"
  ssl_policy        = "ELBSecurityPolicy-TLS13-1-2-2021-06"
  certificate_arn   = aws_acm_certificate.api.arn

  default_action {
    type             = "forward"
    target_group_arn = aws_lb_target_group.api.arn
  }
}

resource "aws_ecs_service" "api" {
  name            = "insurimple-api-${var.environment}"
  cluster         = aws_ecs_cluster.main.id
  task_definition = aws_ecs_task_definition.api.arn
  desired_count   = var.api_desired_count
  launch_type     = "FARGATE"

  network_configuration {
    subnets          = aws_subnet.private[*].id
    security_groups  = [aws_security_group.api.id]
    assign_public_ip = false # egress goes through the NAT gateway
  }

  load_balancer {
    target_group_arn = aws_lb_target_group.api.arn
    container_name   = "api"
    container_port   = var.api_port
  }

  # Roll forward without dropping below capacity, and roll back automatically if
  # the new tasks never pass their health check.
  deployment_minimum_healthy_percent = 100
  deployment_maximum_percent         = 200

  deployment_circuit_breaker {
    enable   = true
    rollback = true
  }

  # CI updates the image and therefore the task definition revision. Without
  # this, the next terraform apply reverts production to whatever revision
  # state remembers.
  lifecycle {
    ignore_changes = [task_definition, desired_count]
  }

  depends_on = [aws_lb_listener.https]
}
