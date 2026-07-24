import { copyFile, mkdir } from "node:fs/promises"
import { fileURLToPath } from "node:url"

const projectRoot = fileURLToPath(new URL("../", import.meta.url))
const sourceDirectory = fileURLToPath(
  new URL(
    "../src/modules/reports/assets/",
    new URL(import.meta.url),
  ),
)
const outputDirectory = fileURLToPath(
  new URL(
    "../dist/src/modules/reports/assets/",
    new URL(import.meta.url),
  ),
)
const assetNames = [
  "inventory-header.png",
  "inventory-footer.png",
]

await mkdir(outputDirectory, { recursive: true })

await Promise.all(
  assetNames.map((assetName) =>
    copyFile(
      `${sourceDirectory}${assetName}`,
      `${outputDirectory}${assetName}`,
    ),
  ),
)

console.log(
  `Copied inventory report assets for ${projectRoot}.`,
)
