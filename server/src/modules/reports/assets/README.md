# Inventory report assets

The PDF report uses these approved, complete branding strips:

- `inventory-header.png`
- `inventory-footer.png`

The header already contains the official SITEAO logo and organization name.
The PDF must not render a separate logo or duplicate organization text.

The build copies both files into `dist/src/modules/reports/assets`. At runtime,
the report loader reads them relative to its module and embeds them as PNG data
URLs, so Chromium never receives a local filesystem path.
