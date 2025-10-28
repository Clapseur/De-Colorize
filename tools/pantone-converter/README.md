# Hex → Pantone Converter (Local)

CLI tool to convert a hex color (e.g. `#FF5733`) to the closest Pantone using CIELAB ΔE2000.

## Usage

```bash
node index.js #FF5733 --export out.csv --html compare.html
```

Options:
- `--export <file>`: append result as CSV
- `--html <file>`: generate a simple HTML comparison (input vs Pantone)

## Dataset

Pantone colors are loaded from `pantone.json`. You can replace it with a full official dataset (name, number, hex). The converter supports large lists.

## Packaging (Windows)

Install dependencies and build executable:

```bash
cd tools/pantone-converter
npm i
npm run pack:win
```

Produces `pantone-converter.exe` usable standalone.

## Notes

- Input validation accepts `#RRGGBB` only.
- History is logged to `history.log` with ΔE00 for auditing.

