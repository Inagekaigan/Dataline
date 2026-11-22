# Dataline

A local-first cleaner for tabular machine-learning datasets. Open **index.html** in a browser. All application assets are bundled and the app makes no network requests.

Import a UTF-8 comma-separated CSV or tab-separated TSV with a header row (up to 12 MiB). Cleaning runs on import and updates when a rule changes. Compare the original and cleaned previews, download the cleaned file, or export a JSON change report.

By default, the cleaner trims surrounding whitespace, drops empty records and removes duplicate rows, keeping the first occurrence. Missing-marker normalization is optional because strings such as NA can be valid labels. Values and identifiers remain strings. Numeric outliers, target labels and missing values are left for domain-specific decisions. Quoted delimiters, multiline fields and escaped quotes are supported. Malformed records are reported before the current dataset is replaced.

The opening example is synthetic sensor data. Input files are kept in memory for the current tab. Downloaded reports include the source filename and change counts.

Run the regression checks with `node test.js`.
