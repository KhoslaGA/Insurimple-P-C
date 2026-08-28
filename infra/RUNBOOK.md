# Runbook — provisioning, backup, restore

**Status: UNREHEARSED.** No AWS resources exist. Every command below is written
against the Terraform in this directory and has **not been executed**. The DB.8
ticket says it plainly — *"a backup you have never restored is a hypothesis"* —
and that is exactly what section 3 currently is. It stops being one the first
time someone runs it and corrects this file.

---

## 1. Provision — the trigger is the first real client record

Do not run this early. Provisioning before there is data buys an idle bill and a
security surface, not progress. The gate is RIBO registration plus at least one
carrier appointment.

```bash
cd infra
cp prod.tfvars.example prod.tfvars      # nothing secret goes in here

terraform init
terraform plan  -var-file=prod.tfvars   # read this. All of it.
terraform apply -var-file=prod.tfvars
```

**Before `apply`, three things Terraform will not tell you:**

- `var.api_image` still points at `PLACEHOLDER.dkr.ecr…`. The ECS service will
  not start until it is a real ECR URI. Build and push first.
- The ACM certificate for `api.insurimple.com` issues only after its DNS
  validation record exists. The domain is at GoDaddy, so that record is created
  by hand and `apply` will sit waiting until it is.
- `aws_secretsmanager_secret_version.clerk_placeholder` writes the literal string
  `REPLACE-ME-IN-THE-CONSOLE`. Put the real Clerk secret key in through the
  console — deliberately not through Terraform, because Terraform would write it
  to state in plaintext.

### Then create the application role

Terraform generates `insurimple_app`'s password into
`insurimple/prod/db/app`, but the role is created `LOGIN` with **no password**
by migration `0014` — on purpose, so that no credential lives in a checked-in
migration. Connect once as the master user and set it:

```bash
MASTER=$(aws secretsmanager get-secret-value --secret-id insurimple/prod/db/master \
          --query SecretString --output text)
APP=$(aws secretsmanager get-secret-value --secret-id insurimple/prod/db/app \
          --query SecretString --output text | jq -r .url)

export DATABASE_URL="postgresql://insurimple_master:$(jq -r .password <<<"$MASTER")@$(jq -r .host <<<"$MASTER"):5432/insurimple?sslmode=verify-full"

pnpm --filter @insurimple/db migrate
psql "$DATABASE_URL" -c "ALTER ROLE insurimple_app PASSWORD '<the password from the app secret>'"
```

### Run every suite against the real host before it holds anything

This is the acceptance criterion, and it is the whole reason the topology work
came before provisioning. If these pass against RDS with the real role topology,
the topology is sound.

```bash
DATABASE_URL="$MASTER_URL"  pnpm --filter @insurimple/db test        # 61 schema assertions
DATABASE_URL="$MASTER_URL"  pnpm --filter @insurimple/db test:rls    # 188 isolation assertions
DATABASE_URL="$MASTER_URL"  pnpm --filter @insurimple/db test:export # Parquet round trip
TEST_DATABASE_URL="$MASTER_URL" pnpm --filter @insurimple/api test   # 70 API tests
```

> `test:rls` connects as `insurimple_app` and **refuses to start** if that role
> turns out to be a superuser, hold `BYPASSRLS`, or own the tables. On a managed
> host that refusal is the single most valuable thing in this list: it is how you
> find out RDS handed you something other than what you asked for.

> pgTAP must be available. It is on the RDS supported-extensions list; if
> `CREATE EXTENSION pgtap` fails on the instance, the RLS suite cannot run there
> and that is a finding, not a workaround.

---

## 2. Backup — two mechanisms, two different problems

Confusing these is how a brokerage discovers in year four that it can restore
last month and nothing else.

| | PITR (automated) | S3 archive |
|---|---|---|
| answers | "the database broke an hour ago" | "a regulator wants a 2027 file, in 2033" |
| window | 35 days, the RDS maximum | ≥ 6 years, Object Lock COMPLIANCE |
| deletable by an admin | yes | **no, not even by root** |
| configured in | `aws_db_instance.backup_retention_period` | `aws_s3_bucket_object_lock_configuration` |

PITR is disaster recovery. The archive is the RIBO records obligation. An archive
an administrator can delete is not evidence, which is why the lock mode is
COMPLIANCE and not GOVERNANCE.

### Monthly archive

Run from a task in the private subnets — S3 goes over the gateway endpoint, so
this does not traverse the NAT and is not billed per GB.

```bash
STAMP=$(date -u +%Y-%m)
pg_dump "$DATABASE_URL" --format=custom --compress=9 \
  --file="/tmp/insurimple-${STAMP}.dump"

aws s3 cp "/tmp/insurimple-${STAMP}.dump" \
  "s3://insurimple-prod-archive/pg_dump/${STAMP}/insurimple-${STAMP}.dump" \
  --sse aws:kms --sse-kms-key-id "$KMS_KEY_ARN"

shred -u "/tmp/insurimple-${STAMP}.dump"
```

`--format=custom` rather than plain SQL: it is the only format `pg_restore` can
restore **selectively** from, which is what a spot check asking for one file
actually needs.

---

## 3. Restore — rehearse this before you need it

**Rehearse into a scratch database, not into anything.** Then correct this file
with what actually happened, and record the wall-clock time: at ~50–70 GB a
restore is tens of minutes, not seconds, and knowing the number in advance is the
difference between an incident and a panic.

```bash
# 1. A scratch instance from the same snapshot family. NOT the production one.
aws rds restore-db-instance-from-db-snapshot \
  --db-instance-identifier insurimple-restore-test \
  --db-snapshot-identifier <snapshot-id> \
  --db-instance-class db.t4g.small

# 2. Or, from the archive, into an empty database:
aws s3 cp s3://insurimple-prod-archive/pg_dump/2027-03/insurimple-2027-03.dump .
createdb -h "$SCRATCH_HOST" -U insurimple_master insurimple_restore
pg_restore -h "$SCRATCH_HOST" -U insurimple_master -d insurimple_restore \
  --no-owner --role=insurimple_migrator --jobs=4 insurimple-2027-03.dump
```

`--no-owner --role=insurimple_migrator` is load-bearing. A dump restored under
the master role leaves every table owned by the master, and `FORCE ROW LEVEL
SECURITY` protects row visibility for an owner but does not stop that owner
altering policies or dropping tables. Restoring ownership to the wrong role
quietly undoes the entire DB.1 topology.

### Verify the restore, do not assume it

A restore that completes is not a restore that worked.

```bash
DATABASE_URL="$SCRATCH_URL" pnpm --filter @insurimple/db test:rls
```

If tenant isolation holds on the restored copy, the restore preserved the
policies, the roles and the FORCE flags — which is the property that actually
matters and the one a row count cannot tell you.

**Then tear the scratch instance down.** A forgotten restore-test instance is a
second copy of every client record, outside the archive's controls, billing
monthly.

---

## 4. What is NOT here, and should be before go-live

- **CI/CD to ECS.** The task definition is written; nothing pushes an image or
  rolls a deployment. `aws_ecs_service` deliberately ignores changes to
  `task_definition` so CI owns the revision — but CI does not exist yet.
- **Alarms.** No CloudWatch alarms on CPU credits, storage headroom, connection
  count, or the `log_min_duration_statement` slow-query stream. The logs are
  being written and nobody is being told.
- **The monthly archive job.** The commands in §2 are not scheduled. An EventBridge
  rule plus a Fargate task is the shape; it is not written.
- **DNS.** `api.insurimple.com` must point at the ALB, and the ACM validation
  record must exist first. GoDaddy, by hand.
- **A rehearsed restore.** See the top of this file.
