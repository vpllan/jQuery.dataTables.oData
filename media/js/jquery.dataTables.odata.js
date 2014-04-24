/**
 * @summary     DataTables OData addon
 * @description Enables jQuery DataTables plugin to read data from OData service.
 * @version     1.0.3
 * @file        jquery.dataTables.odata.js
 * @authors     Jovan & Vida Popovic
 *
 * @copyright Copyright 2014 Jovan & Vida Popovic, all rights reserved.
 *
 * This source file is free software, under either the GPL v2 license or a
 * BSD style license, available at:
 *   http://datatables.net/license_gpl2
 *   http://datatables.net/license_bsd
 * 
 * This source file is distributed in the hope that it will be useful, but 
 * WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY 
 * or FITNESS FOR A PARTICULAR PURPOSE. See the license files for details.
 * 
 */

function fnServerOData(sUrl, aoData, fnCallback, oSettings) {

    var oParams = {};
    $.each(aoData, function (i, value) {
        oParams[value.name] = value.value;
    });

    var data = {
        "$format": "json"
    };

    // If OData service is placed on the another domain use JSONP.
    var bJSONP = oSettings.oInit.bUseODataViaJSONP;

    if (bJSONP) {
        data.$callback = "odatatable_" + (oSettings.oFeatures.bServerSide ? oParams.sEcho : ("load_" + Math.floor((Math.random() * 1000) + 1)));
    }

    $.each(oSettings.aoColumns, function (i, value) {
        var sFieldName = (value.sName !== null && value.sName !== "") ? value.sName : ((typeof value.mData === 'string') ? value.mData : null);
        if (sFieldName === null || !isNaN(Number(sFieldName))) {
            sFieldName = value.sTitle;
        }
        if (sFieldName === null || !isNaN(Number(sFieldName))) {
            return;
        }
        if (data.$select == null) {
            data.$select = sFieldName;
        } else {
            data.$select += "," + sFieldName;
        }
    });

    if (oSettings.oFeatures.bServerSide) {

        data.$skip = oSettings._iDisplayStart;
        if (oSettings._iDisplayLength > -1) {
            data.$top = oSettings._iDisplayLength;
        }

        // OData versions prior to v4 used $inlinecount=allpages; but v4 is uses $count=true
        if (oSettings.oInit.iODataVersion !== null && oSettings.oInit.iODataVersion < 4) {
            data.$inlinecount = "allpages";
        } else {
            data.$count = true;
        }

        var asFilters = [];
        var asColumnFilters = []; //used for jquery.dataTables.columnFilter.js
        $.each(oSettings.aoColumns,
            function (i, value) {

                var sFieldName = value.sName || value.mData;
                var columnFilter = oParams["sSearch_" + i]; //fortunately columnFilter's _number matches the index of aoColumns

                if (oParams.sSearch !== null && oParams.sSearch !== "" && value.bSearchable) {
                    switch (value.sType) {
                    case 'string':
                    case 'html':

                        // asFilters.push("substringof('" + oParams.sSearch + "', " + sFieldName + ")");
                        // substringof does not work in v4???
                        asFilters.push("indexof(tolower(" + sFieldName + "), '" + oParams.sSearch.toLowerCase() + "') gt -1");
                        break;

                    case 'date':
                    case 'numeric':
                    default:
                        // Currently, we cannot search date and numeric fields (exception on the OData service side)
                    }
                }

                /*  This currently does not exclude 'number' and 'date' passed via jquery.dataTables.columnFilter
                    The simplest workaround is to use { type: null } in the columnFilter plugin to exclude it. 
                    This isn't a bad thing, as it is better to explicitly exlude it so that the user doesn't see the UI for the column filter.
                */
                if (columnFilter !== null && columnFilter !== "") {
                    asColumnFilters.push("indexof(tolower(" + sFieldName + "), '" + columnFilter.toLowerCase() + "') gt -1");
                }
            });

        if (asFilters.length > 0) {
            data.$filter = asFilters.join(" or ");
        }

        if (asColumnFilters.length > 0) {
            if (data.$filter !== undefined) {
                data.$filter = " ( " + data.$filter + " ) and ( " + asColumnFilters.join(" and ") + " ) ";
            } else {
                data.$filter = asColumnFilters.join(" and ");
            }
        }

        var asOrderBy = [];
        for (var i = 0; i < oParams.iSortingCols; i++) {
			asOrderBy.push(oParams["mDataProp_" + oParams["iSortCol_" + i]] + " " + (oParams["sSortDir_" + i] || ""));
        }
		
        if (asOrderBy.length > 0) {
            data.$orderby = asOrderBy.join();
        }
    }
    $.ajax(jQuery.extend({}, oSettings.oInit.ajax, {
        "url": sUrl,
        "data": data,
        "jsonp": bJSONP,
        "dataType": bJSONP ? "jsonp" : "json",
        "jsonpCallback": data["$callback"],
        "cache": false,
        "success": function (data) {
            var oDataSource = {};

            // Probe data structures for V4, V3, and V2 versions of OData response
            oDataSource.aaData = data.value || (data.d && data.d.results) || data.d;
            var iCount = (data["@odata.count"]) ? data["@odata.count"] : ((data["odata.count"]) ? data["odata.count"] : ((data.__count) ? data.__count : (data.d && data.d.__count)));

            if (iCount == null) {
                if (oDataSource.aaData.length === oSettings._iDisplayLength) {
                    oDataSource.iTotalRecords = oSettings._iDisplayStart + oSettings._iDisplayLength + 1;
                } else {
                    oDataSource.iTotalRecords = oSettings._iDisplayStart + oDataSource.aaData.length;
                }
            } else {
                oDataSource.iTotalRecords = iCount;
            }

            oDataSource.iTotalDisplayRecords = oDataSource.iTotalRecords;

            fnCallback(oDataSource);
        }
    }));

} // end fnServerData