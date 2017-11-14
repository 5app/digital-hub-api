# Reports

The script [./report.js](./report.js) accepts the name of the reports which is contained in the [./reports Directory](./reports/). These are YAML files which are converted to JSON and parsed to our API endpoint, with the `format=csv` option.

You can demo this example and generate CSV reports via the command line...

```bash
node -r dotenv/config report/report.js playlist-popularity > report.csv
```