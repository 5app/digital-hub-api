# Bulk Upload Content

Given a directory of data, these scripts will process the CSV content and upload the content in relative files as assets on the 5app platform

e.g. 

~/sample
  - assets.csv
  - assetCollections.csv
  - files/*
  - thumbnails/*


# CSV data formats

The file needs to be in CSV format https://tools.ietf.org/html/rfc4180 and values should be double-quoted where appropriate.

- Each row pertains to a single record
- Each column 
	- Provides the name of the field at the top - on the first row.
	- The order of the columns is not important
	- Column titles are not case-sensitive
	- Fields marked with a `*` are required

# Assets

e.g. ./assets.csv


```bash
node -r dotenv/config bulk-upload/bulk-upload ~/sample
```


This is a file which contains...

| Field        | Type          | Description
|--------------|---------------|---------------
| RefID *      | String or Number | This is your reference to the asset and will be used when creating relationships between records, ensuring records can be updated in the future
| Status       | DELETE | If this is set and the value is "DELETE" the item will be removed. No other fields are required if this is given
| Name *       | String, 2048 bytes, UTF8  | Name of asset
| Description  | String, 64 KB | Description of the asset, summary of the content
| Type *       | web, upload, folder, zip or collection  | (See Asset Types)[#asset-types]
| ParentRefID  | String or Number | Reference to the parent folder of this asset or folder
| Tags         | String | Use comma’s to separate multiple tags..
| ThumbnailPath | Relative String or URL | Either **Relative path:** to the script being processed, e.g. thumbnails/my.png OR a **Full URL:** A URL to the image e.g. https://myserver/images/1337.jpg
| WebURL       | URL            | If the asset is type=web, then this field is required
| OpenInIFrame | Boolean        | If the WebURL should be opened within an IFrame. This is ignored if the URL Protocol does not explicitly start with `https://`
| Path         | Relative String or URL | Relative path to the Asset to upload, e.g. /files/my.png. Or a **Full URL**, A URL to the file e.g. https://myserver/images/1337.pdf
| DisableDownload | Boolean     | If the asset is a file, this flag if false will present the user with an optional button allowing them to download the content to their device.
| MimeType     | String, E.g. video/webm | If this is not present this will be automatically assigned
| CompletionTime | Number | Length of time to consume the asset in minutes.


## Asset Types

| Type | Description
|------|---------------------
| Web  | Is for URL addresses
| Upload | Is for files hosted on 5app platform
| Folder | is a type of asset used to form a directory
| Collection | Is another type of asset which is used to reference a collection



## Asset Collections

Assign assets as belonging to a collection

e.g. ./assetCollections.csv

```bash
node -r dotenv/config bulk-upload/assign-asset-collections ~/sample
```

| Field | Description
|-------|-------------
| AssetRefId * | String/Number | Reference ID matching an asset in asset.csv
| CollectionRefId * | String/Number | Reference ID matching a asset in asset.csv of type=collection
| Status | DELETE | If =DELETE removes the association
| Rank | Number | A relative rank position to other assets in the same collection. Low values will appear first.
