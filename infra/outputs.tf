output "db_endpoint" {
  description = "Direct connection — no RDS Proxy (ADR 0002 §5)."
  value       = aws_db_instance.main.address
}

output "db_app_secret_arn" {
  description = "The ONLY credential apps/api should ever hold. The master secret runs migrations and is never in the API environment."
  value       = aws_secretsmanager_secret.db_app.arn
}

output "db_master_secret_arn" {
  description = "Migrations and role creation. Not for the application."
  value       = aws_secretsmanager_secret.db_master.arn
}

output "archive_bucket" {
  description = "pg_dump archives, Object Lock COMPLIANCE. The six-year records obligation."
  value       = aws_s3_bucket.archive.id
}

output "training_bucket" {
  description = "ai_action Parquet exports. Separate lifecycle by design (invariant 16)."
  value       = aws_s3_bucket.training.id
}

output "kms_key_arn" {
  value = aws_kms_key.main.arn
}
