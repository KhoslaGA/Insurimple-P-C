###############################################################################
# Insurimple — AWS, ca-central-1 (DB.8)
#
# WRITTEN NOW, APPLIED LATER. The trigger for `terraform apply` is the first
# real client record — RIBO registration and carrier appointments. Provisioning
# before there is data buys an idle bill and a security surface, not progress.
#
# Everything above DB.8 runs on local and CI Postgres, so nothing here gates
# development. What this file buys today is that the shape is decided and
# reviewable while it is still free to change.
#
#   terraform init
#   terraform plan   -var-file=prod.tfvars      # safe, reads nothing that costs
#   terraform apply  -var-file=prod.tfvars      # NOT until the trigger
###############################################################################

terraform {
  required_version = ">= 1.9"
  required_providers {
    aws    = { source = "hashicorp/aws", version = "~> 5.70" }
    random = { source = "hashicorp/random", version = "~> 3.6" }
  }

  # Uncomment once the state bucket exists. Chicken-and-egg: create it by hand
  # or with a one-off local-state apply, then migrate. Local state for a
  # database holding six years of regulated records is not acceptable
  # long-term — it cannot be locked, and two applies from two machines silently
  # diverge.
  # backend "s3" {
  #   bucket       = "insurimple-tfstate"
  #   key          = "prod/terraform.tfstate"
  #   region       = "ca-central-1"
  #   encrypt      = true
  #   use_lockfile = true
  # }
}

provider "aws" {
  region = var.region
  default_tags {
    tags = {
      Project     = "insurimple"
      Environment = var.environment
      ManagedBy   = "terraform"
      # Data residency is a sales constraint, not only a legal one. Tagging it
      # makes "is any of this outside Canada?" answerable from the console.
      DataClass = "regulated-ca"
    }
  }
}

###############################################################################
# Network
#
# The database is not reachable from the internet. Not "has a strong password"
# — not routable. Private subnets with no NAT for the data tier; the API sits
# in private subnets with egress through a NAT gateway for Clerk and carrier
# APIs, and is reached only through the load balancer.
###############################################################################

data "aws_availability_zones" "available" {
  state = "available"
}

resource "aws_vpc" "main" {
  cidr_block           = var.vpc_cidr
  enable_dns_support   = true
  enable_dns_hostnames = true
  tags                 = { Name = "insurimple-${var.environment}" }
}

resource "aws_internet_gateway" "main" {
  vpc_id = aws_vpc.main.id
  tags   = { Name = "insurimple-${var.environment}" }
}

# Two AZs because an RDS subnet group requires them, even Single-AZ. This is
# not Multi-AZ — see the non-goals; it is the minimum the API demands.
resource "aws_subnet" "public" {
  count                   = 2
  vpc_id                  = aws_vpc.main.id
  cidr_block              = cidrsubnet(var.vpc_cidr, 4, count.index)
  availability_zone       = data.aws_availability_zones.available.names[count.index]
  map_public_ip_on_launch = false
  tags                    = { Name = "insurimple-public-${count.index}" }
}

resource "aws_subnet" "private" {
  count             = 2
  vpc_id            = aws_vpc.main.id
  cidr_block        = cidrsubnet(var.vpc_cidr, 4, count.index + 4)
  availability_zone = data.aws_availability_zones.available.names[count.index]
  tags              = { Name = "insurimple-private-${count.index}" }
}

resource "aws_eip" "nat" {
  domain = "vpc"
  tags   = { Name = "insurimple-nat" }
}

# One NAT gateway, not one per AZ. At single-digit concurrency the second is
# ~$32/month for an availability property Multi-AZ is explicitly a non-goal on.
resource "aws_nat_gateway" "main" {
  allocation_id = aws_eip.nat.id
  subnet_id     = aws_subnet.public[0].id
  depends_on    = [aws_internet_gateway.main]
  tags          = { Name = "insurimple-nat" }
}

resource "aws_route_table" "public" {
  vpc_id = aws_vpc.main.id
  route {
    cidr_block = "0.0.0.0/0"
    gateway_id = aws_internet_gateway.main.id
  }
}

resource "aws_route_table" "private" {
  vpc_id = aws_vpc.main.id
  route {
    cidr_block     = "0.0.0.0/0"
    nat_gateway_id = aws_nat_gateway.main.id
  }
}

resource "aws_route_table_association" "public" {
  count          = 2
  subnet_id      = aws_subnet.public[count.index].id
  route_table_id = aws_route_table.public.id
}

resource "aws_route_table_association" "private" {
  count          = 2
  subnet_id      = aws_subnet.private[count.index].id
  route_table_id = aws_route_table.private.id
}

# S3 through a gateway endpoint rather than the NAT: pg_dump archives are the
# largest thing this VPC moves, and NAT data processing is billed per GB while
# a gateway endpoint is free.
resource "aws_vpc_endpoint" "s3" {
  vpc_id            = aws_vpc.main.id
  service_name      = "com.amazonaws.${var.region}.s3"
  vpc_endpoint_type = "Gateway"
  route_table_ids   = [aws_route_table.private.id]
}

###############################################################################
# Security groups
###############################################################################

resource "aws_security_group" "alb" {
  name        = "insurimple-alb-${var.environment}"
  description = "Public ingress to the API"
  vpc_id      = aws_vpc.main.id

  ingress {
    description = "HTTPS from the internet"
    from_port   = 443
    to_port     = 443
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }
}

resource "aws_security_group" "api" {
  name        = "insurimple-api-${var.environment}"
  description = "The NestJS API"
  vpc_id      = aws_vpc.main.id

  ingress {
    description     = "From the load balancer only"
    from_port       = var.api_port
    to_port         = var.api_port
    protocol        = "tcp"
    security_groups = [aws_security_group.alb.id]
  }

  egress {
    description = "Clerk, carrier APIs, S3"
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }
}

# The database accepts connections from the API's security group and from
# nothing else. Not a CIDR — a security group, so it stays correct when subnets
# change.
resource "aws_security_group" "db" {
  name        = "insurimple-db-${var.environment}"
  description = "PostgreSQL, reachable only from the API"
  vpc_id      = aws_vpc.main.id

  ingress {
    description     = "PostgreSQL from the API"
    from_port       = 5432
    to_port         = 5432
    protocol        = "tcp"
    security_groups = [aws_security_group.api.id]
  }

  # No egress block at all. The AWS provider manages security group rules
  # exhaustively, so omitting it removes the default allow-all — which is how an
  # exfiltration path stays open. A database has no reason to originate a
  # connection. (A 0.0.0.0/0-to-127.0.0.1 rule would express the same thing and
  # read as a mistake to the next person.)
}

###############################################################################
# Encryption
#
# A customer-managed key rather than the AWS-managed default: only a CMK can be
# rotated, audited and — the one that matters — DENIED. "Prove the data was
# unreadable" is answerable with a key policy and not with aws/rds.
###############################################################################

resource "aws_kms_key" "main" {
  description             = "Insurimple ${var.environment} — RDS and S3"
  enable_key_rotation     = true
  deletion_window_in_days = 30
}

resource "aws_kms_alias" "main" {
  name          = "alias/insurimple-${var.environment}"
  target_key_id = aws_kms_key.main.key_id
}

###############################################################################
# RDS PostgreSQL 16
###############################################################################

resource "aws_db_subnet_group" "main" {
  name       = "insurimple-${var.environment}"
  subnet_ids = aws_subnet.private[*].id
}

# force_ssl is not decoration. Without it a misconfigured client negotiates
# plaintext and nothing complains; with it the server refuses, which is the
# direction a failure should point.
resource "aws_db_parameter_group" "main" {
  name   = "insurimple-pg16-${var.environment}"
  family = "postgres16"

  parameter {
    name  = "rds.force_ssl"
    value = "1"
  }

  # Log anything slower than a second. At 100k policies a query that crosses
  # this is a plan regression, and the alternative is finding out from a broker
  # on the phone.
  parameter {
    name  = "log_min_duration_statement"
    value = "1000"
  }

  parameter {
    name  = "log_connections"
    value = "1"
  }

  # An abandoned transaction holds tenant context and blocks vacuum on the
  # largest tables in the database. Also set on the role in 0014 — belt and
  # braces, because the role setting is one ALTER ROLE ... RESET ALL from gone.
  parameter {
    name  = "idle_in_transaction_session_timeout"
    value = "60000"
  }
}

resource "random_password" "db_master" {
  length  = 32
  special = false # RDS rejects several punctuation characters; not worth the entropy argument
}

resource "aws_db_instance" "main" {
  identifier     = "insurimple-${var.environment}"
  engine         = "postgres"
  engine_version = "16"
  instance_class = var.db_instance_class

  # gp3 over gp2: baseline IOPS are not tied to volume size, so a 100 GB volume
  # is not also a performance decision.
  allocated_storage     = var.db_allocated_storage
  max_allocated_storage = var.db_max_allocated_storage
  storage_type          = "gp3"
  storage_encrypted     = true
  kms_key_id            = aws_kms_key.main.arn

  db_name  = "insurimple"
  username = "insurimple_master"
  password = random_password.db_master.result

  db_subnet_group_name   = aws_db_subnet_group.main.name
  vpc_security_group_ids = [aws_security_group.db.id]
  parameter_group_name   = aws_db_parameter_group.main.name
  publicly_accessible    = false

  # Single-AZ. Multi-AZ is a non-goal at single-digit concurrency and is a
  # one-setting change if a carrier agreement demands it.
  multi_az = false

  # PITR is DISASTER RECOVERY, and 35 days is its maximum. It is NOT the
  # six-year RIBO records obligation — that is the S3 archive below. Conflating
  # them is how a brokerage discovers in year four that it can restore last
  # month and nothing else.
  backup_retention_period = 35
  backup_window           = "07:00-08:00" # ~02:00-03:00 America/Toronto
  maintenance_window      = "Sun:08:00-Sun:09:00"
  copy_tags_to_snapshot   = true

  performance_insights_enabled    = true
  performance_insights_kms_key_id = aws_kms_key.main.arn
  monitoring_interval             = 60
  monitoring_role_arn             = aws_iam_role.rds_monitoring.arn
  enabled_cloudwatch_logs_exports = ["postgresql", "upgrade"]

  auto_minor_version_upgrade = true
  deletion_protection        = true
  skip_final_snapshot        = false
  final_snapshot_identifier  = "insurimple-${var.environment}-final"

  lifecycle {
    # The password is rotated in Secrets Manager, not by Terraform. Without
    # this, every plan wants to reset it to whatever state remembers.
    ignore_changes = [password]
  }
}

resource "aws_iam_role" "rds_monitoring" {
  name = "insurimple-rds-monitoring-${var.environment}"
  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect    = "Allow"
      Principal = { Service = "monitoring.rds.amazonaws.com" }
      Action    = "sts:AssumeRole"
    }]
  })
}

resource "aws_iam_role_policy_attachment" "rds_monitoring" {
  role       = aws_iam_role.rds_monitoring.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AmazonRDSEnhancedMonitoringRole"
}

###############################################################################
# Secrets
#
# TWO secrets, because there are two roles and only one of them may run DDL.
# The master credential exists to run migrations and to create the app role; it
# is never in the API's environment. `insurimple_app` is what DATABASE_URL
# carries (invariant 2 / 0014).
#
# insurimple_app's password is created here and set on the role by the
# migration runner — 0014 creates the role LOGIN with NO password precisely so
# that no credential lives in a checked-in migration.
###############################################################################

resource "random_password" "db_app" {
  length  = 32
  special = false
}

resource "aws_secretsmanager_secret" "db_master" {
  name       = "insurimple/${var.environment}/db/master"
  kms_key_id = aws_kms_key.main.arn
}

resource "aws_secretsmanager_secret_version" "db_master" {
  secret_id = aws_secretsmanager_secret.db_master.id
  secret_string = jsonencode({
    username = aws_db_instance.main.username
    password = random_password.db_master.result
    host     = aws_db_instance.main.address
    port     = aws_db_instance.main.port
    dbname   = aws_db_instance.main.db_name
  })
}

resource "aws_secretsmanager_secret" "db_app" {
  name       = "insurimple/${var.environment}/db/app"
  kms_key_id = aws_kms_key.main.arn
}

resource "aws_secretsmanager_secret_version" "db_app" {
  secret_id = aws_secretsmanager_secret.db_app.id
  secret_string = jsonencode({
    # No RDS Proxy in the host (ADR 0002 §5): the proxy pins on set_config(),
    # which this application calls on every transaction, so it would pool
    # nothing. This URL points at the instance directly, on purpose.
    url = format(
      "postgresql://insurimple_app:%s@%s:%s/%s?sslmode=verify-full",
      random_password.db_app.result,
      aws_db_instance.main.address,
      aws_db_instance.main.port,
      aws_db_instance.main.db_name,
    )
  })
}

###############################################################################
# S3 — the records archive
#
# This is the six-year RIBO obligation, and it is a DIFFERENT PROBLEM from
# PITR. PITR answers "the database broke an hour ago". This answers "a regulator
# has asked for a 2027 file in 2033". Object Lock in COMPLIANCE mode means not
# even the root account can delete inside the retention window — which is the
# point: an archive an administrator can delete is not evidence.
###############################################################################

resource "aws_s3_bucket" "archive" {
  bucket              = "insurimple-${var.environment}-archive"
  object_lock_enabled = true

  # Object Lock cannot be enabled after creation. Getting this wrong means
  # recreating the bucket and re-uploading every archive.
  lifecycle {
    prevent_destroy = true
  }
}

resource "aws_s3_bucket_object_lock_configuration" "archive" {
  bucket = aws_s3_bucket.archive.id
  rule {
    default_retention {
      mode = "COMPLIANCE"
      days = var.archive_retention_days # 6 years + a margin
    }
  }
}

resource "aws_s3_bucket_versioning" "archive" {
  bucket = aws_s3_bucket.archive.id
  versioning_configuration { status = "Enabled" }
}

resource "aws_s3_bucket_server_side_encryption_configuration" "archive" {
  bucket = aws_s3_bucket.archive.id
  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm     = "aws:kms"
      kms_master_key_id = aws_kms_key.main.arn
    }
    bucket_key_enabled = true
  }
}

resource "aws_s3_bucket_public_access_block" "archive" {
  bucket                  = aws_s3_bucket.archive.id
  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

resource "aws_s3_bucket_lifecycle_configuration" "archive" {
  bucket = aws_s3_bucket.archive.id
  rule {
    id     = "cold-after-90-days"
    status = "Enabled"
    filter {}

    # A six-year archive is read approximately never — a spot check, an E&O
    # claim. Glacier Instant Retrieval keeps it a millisecond read at roughly a
    # fifth the price, and Deep Archive's twelve-hour restore is the wrong
    # trade when a regulator has set a deadline.
    transition {
      days          = 90
      storage_class = "GLACIER_IR"
    }

    # No expiration rule. Object Lock governs retention; a lifecycle expiration
    # alongside it is two mechanisms disagreeing about the same obligation.
  }
}

# The AI training lake. Separate bucket, no Object Lock, its own lifecycle —
# because training data retention is an ASSET decision and client records are a
# REGULATORY one, and CLAUDE.md invariant 16 says neither governs the other.
# Putting them in one bucket is how the strictest silently wins.
resource "aws_s3_bucket" "training" {
  bucket = "insurimple-${var.environment}-training"
}

resource "aws_s3_bucket_server_side_encryption_configuration" "training" {
  bucket = aws_s3_bucket.training.id
  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm     = "aws:kms"
      kms_master_key_id = aws_kms_key.main.arn
    }
    bucket_key_enabled = true
  }
}

resource "aws_s3_bucket_public_access_block" "training" {
  bucket                  = aws_s3_bucket.training.id
  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

resource "aws_s3_bucket_lifecycle_configuration" "training" {
  bucket = aws_s3_bucket.training.id
  rule {
    id     = "training-data-retention"
    status = "Enabled"
    filter {}
    expiration { days = var.training_retention_days }
  }
}
