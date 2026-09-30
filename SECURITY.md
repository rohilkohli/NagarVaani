# Security

Report vulnerabilities privately to the repository owner rather than opening a public issue.

Rotate the previously exposed Google Maps API key immediately, then restrict the replacement by HTTP referrer and enabled API.

Keep `.env` files and service-account credentials outside Git. Production must provide real secrets through the deployment secret manager.