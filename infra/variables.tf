variable "region" {
  description = "Canadian residency is a sales constraint, not only a legal one — this is not a knob to turn for a cheaper region."
  type        = string
  default     = "ca-central-1"
  validation {
    condition     = startswith(var.region, "ca-")
    error_message = "Insurimple data must stay in Canada. Changing this is a business decision, not a Terraform one."
  }
}

variable "environment" {
  type    = string
  default = "prod"
}

variable "vpc_cidr" {
  type    = string
  default = "10.40.0.0/16"
}

variable "api_port" {
  type    = number
  default = 3001
}

variable "db_instance_class" {
  description = "t4g.small over micro: 2 GB is the difference between comfortable and tight once shared buffers and connection state are accounted for."
  type        = string
  default     = "db.t4g.small"
}

variable "db_allocated_storage" {
  description = "The book is 1-2 GB; audit_event is ~70% of the database and reaches 25-40 GB over six years."
  type        = number
  default     = 50
}

variable "db_max_allocated_storage" {
  description = "Storage autoscaling ceiling. Set so a runaway cannot silently become a four-figure bill."
  type        = number
  default     = 200
}

variable "archive_retention_days" {
  description = "Six years of RIBO retention plus a margin, in Object Lock COMPLIANCE mode. Not reducible after the fact — that is the point."
  type        = number
  default     = 2250
}

variable "training_retention_days" {
  description = "Deliberately NOT the records obligation (invariant 16). Training data is an asset decision and a privacy exposure that grows with time."
  type        = number
  default     = 730
}

variable "api_image" {
  description = "ECR image URI for apps/api. CI updates the task definition; Terraform does not own the tag."
  type        = string
  default     = "PLACEHOLDER.dkr.ecr.ca-central-1.amazonaws.com/insurimple-api:latest"
}

variable "api_cpu" {
  type    = number
  default = 512
}

variable "api_memory" {
  type    = number
  default = 1024
}

variable "api_desired_count" {
  description = "Two tasks, not one — a single task means a deploy is an outage."
  type        = number
  default     = 2
}

variable "api_domain" {
  description = "The API hostname the ACM certificate is issued for."
  type        = string
  default     = "api.insurimple.com"
}
