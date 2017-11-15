# Bulk Upload Content

The example here parses a CSV document and creates or updates the tenant assets

```basb
node -r dotenv/config bulk-upload/bulk-upload.js /Users/andrewdodson/Downloads/data/folders.csv
```

To assign Assets into Collections 
```basb
node -r dotenv/config bulk-upload/assign-asset-collections /Users/andrewdodson/Downloads/data/collection-assets.csv
```