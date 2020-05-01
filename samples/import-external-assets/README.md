# Usage
In project repo's samples directory:
```sh
node -r dotenv/config import-external-assets/import-external-assets.js import-external-assets/data/external_assets.csv

# for debug mode proceed with NODE_DEBUG=request 

NODE_DEBUG=request node -r dotenv/config import-external-assets/import-external-assets.js import-external-assets/data/external_assets.csv
```

# CSV data formats
- Each row pertains to a single record
- Each column 
	- Provides the name of the field at the top - on the first row.
	- The order of the columns is not important
	- Column titles are not case-sensitive
	- All fields are required


## Data structure for CSV file

| Column Name:       | Type           | Description                                          |
| ------------------ |:--------------:| ----------------------------------------------------:|
| AssetId            | Integer        | this is internal asset id (assetDomains.asset_id)    |
| ExternalAssetId    | Integer        | this is an id of an asset in external system         |
| ExternalAssetType  | Enum           | this is an type of an asset in external system type  | 
|                    |                | possible values: ('material', 'e-learning', 'video') |
