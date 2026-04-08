variable "cloudflare_api_token" {
  description = "Cloudflare API Token with D1 and R2 permissions"
  type        = string
  sensitive   = true
}

variable "cloudflare_account_id" {
  description = "Cloudflare Account ID"
  type        = string
}