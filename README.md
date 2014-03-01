#jQuery DataTables OData connector

jQuery DataTables OData connector enables standard jQuery DataTables plugin to display data provided by OData service.
Beside displaying, it allows you to filter, sort, and navigate through the data. There are several versions of OData services (v4, v3, and v2), which return results in different formats. This connector 
handles all of these versions (and you simply need to specify a version through "iODataVersion" parameter).

## Setup

Steps:
- Setup jQuery dataTables as you would usually do,
- On top of that include jquery.datatables.odata.js file in your page, 
- Specify location ("sAjaxSource") and version ("iODataVersion") of OData service, and
- Set value of "fnServerData" parameter to "fnServerOData"

**Example:**

```javascript
$('table#products').dataTable({
	"sAjaxSource": "http://services.odata.org/V4/OData/OData.svc/Products",
	"iODataVersion": 4,
	"aoColumns": [
		{ mData: "Name" },
		{ mData: "Description" },
		{ mData: "Rating", sType: 'numeric' },
		{ mData: "Price", sType: 'numeric' },
		{ sName: "ReleaseDate", sType: 'date' }
	],
	"fnServerData": fnServerOData, // required
	"bServerSide": true,  // optional
	"bUseODataViaJSONP": true,	// set to true if using cross-domain requests
});
```

_Note: For full example take a look at submitted html pages._

Functionality for connecting to OData service is placed in the fnServerOData function defined in jquery.datatables.odata.js. This function
should be set as the value of "fnServerData" parameter.

If dataTables is used in server-side processing mode, date columns and numeric columns should be marked as such using "sType" parameter
(because OData service cannot perform text search against these fields). 
Also, for cross-domain requests you need to set	"bUseODataViaJSONP" parameter value to true.