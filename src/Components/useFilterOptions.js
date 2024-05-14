import { useState, useEffect } from "react";

// A hook that takes in a state master data and info about columns keys for which filters need to be created
// and sets the table filters as setStates
// Example: Check the `src\RFIDReports\StockTake\OneSessionReport.js` file in ERPVsStockTake component
export default function useFilterOptions(masterState, columns){
    const [filterOptions, setFilterOptions] = useState({});
    useEffect(() => {
        if(masterState?.length === 0){
            return;
        }
        console.log("Create Table Filter Options Triggeres", columns);
        
        const newFilterOptions = {};
        const filterableColumns = columns;
        // console.log(filterableColumns);
        masterState?.forEach(d => {
            filterableColumns.forEach(fc => {
                if (!newFilterOptions[fc]) {
                    newFilterOptions[fc] = {};
                }
                if (!newFilterOptions[fc][d[fc]]) {
                    newFilterOptions[fc][d[fc]] = {
                        text: d[fc],
                        value: d[fc],
                    }
                }
            })
        })
        Object.keys(newFilterOptions).forEach(k => {
            newFilterOptions[k] = Object.values(newFilterOptions[k]);
        })
        setFilterOptions(newFilterOptions);
    }, [masterState, columns])
    return [filterOptions, setFilterOptions];
}

/*
    Creating the new Table filtes
    1. Select the columns we need to filter
    2. Loop through the data and create a new object with the filterable columns as keys and the values as the filter values
    3. Loop through the new object and create an array of objects with the text and value as the same value
    4. Set the new object as the table filters
*/