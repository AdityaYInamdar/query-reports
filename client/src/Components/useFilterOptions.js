import { useState, useEffect } from "react";

// A hook that takes in a state master data and info about columns keys for which filters need to be created
// and sets the table filters as setStates
// Example: Check the `src\RFIDReports\StockTake\OneSessionReport.js` file in ERPVsStockTake component

// Supports "key" and  "nestesd.key.something"
// The filters will have key as "key" and "nested.key.something"

export default function useFilterOptions(masterState, columns, deps=[masterState, columns]) {
    const [filterOptions, setFilterOptions] = useState({});

    const triggerAgain = () => {
        console.log('triggerAgain');
        if(!masterState?.length){
            return;
        }

        const newFilterOptions = {};
        const filterableColumns = columns;
        // console.log(filterableColumns);
        // masterState.forEach(d => {
        //     filterableColumns.forEach(fc => {
        //         if (!newFilterOptions[fc]) {
        //             newFilterOptions[fc] = {};
        //         }
        //         if (!newFilterOptions[fc][d[fc]]) {
        //             newFilterOptions[fc][d[fc]] = {
        //                 text: d[fc],
        //                 value: d[fc],
        //             }
        //         }
        //     })
        // })
        // Object.keys(newFilterOptions).forEach(k => {
        //     newFilterOptions[k] = Object.values(newFilterOptions[k]);
        // })


        // If split the column by '.' and then use nested object to create the filter options
        // The key of filers will be same 'product.name' and 'product.id' but the data we will get is from the nested object
        masterState?.forEach(d => {
            filterableColumns.forEach(fc => {
                const splitKeys = fc.split('.');
                if (!newFilterOptions[fc]) {
                    newFilterOptions[fc] = {};
                }
                // Instead of d[fc] we will use the nested object
                let nestedObject = d;
                splitKeys.forEach(sk => {
                    nestedObject = nestedObject?.[sk];
                })
                if (!newFilterOptions[fc]?.[nestedObject]) {
                    newFilterOptions[fc][nestedObject] = {
                        text: nestedObject,
                        value: nestedObject,
                    }
                }
            })
        })
        Object.keys(newFilterOptions).forEach(k => {
            newFilterOptions[k] = Object.values(newFilterOptions[k]);
        })

        // console.log("Create Table Filter Options Triggeres", columns, newFilterOptions);


        setFilterOptions(newFilterOptions);
    }

    useEffect(() => {
        triggerAgain();
    }, deps);
    return [filterOptions, setFilterOptions, triggerAgain];
}

/*
    Creating the new Table filtes
    1. Select the columns we need to filter
    2. Loop through the data and create a new object with the filterable columns as keys and the values as the filter values
    3. Loop through the new object and create an array of objects with the text and value as the same value
    4. Set the new object as the table filters
*/
