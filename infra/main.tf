terraform {
  required_providers {
    cloudflare = {
      source = "cloudflare/cloudflare"
      version = "~> 4"
    }
  }

  backend "remote" {
    organization = "srk-automotive"

    workspaces {
      name = "redline"
    }
  }
}

provider "cloudflare" {
  api_token = var.cloudflare_api_token
}