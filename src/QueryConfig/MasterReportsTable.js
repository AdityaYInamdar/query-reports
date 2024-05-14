import React, { useEffect, useState } from "react";
import {
    Input,
    Table,
    Select,
    InputNumber,
    Button,
    DatePicker,
    message,
    Modal,
    Tabs,
    Collapse,
    Tag,
    Checkbox,
    Card,
    Divider,
    Popconfirm,
    Popover,
    Space,
    Drawer,
    Affix,
    Row,
    Col,
    Radio,
} from "antd";
import axios from "axios";
import moment from "moment";
import '../Styles/AllStyles.css';
import { SiMicrosoftexcel } from "react-icons/si";
import { FaSearch } from "react-icons/fa";
import useFilterOptions from "../Components/useFilterOptions";
import SearchComponent from "../Components/SearchComponent";
import { ExportToExcelButton } from "../Components/ExportToExcel";
import MyPortal from "../Components/MyPortal";
import { InputWithLabel } from "../Components/Components";
import { DebugModal } from "./DebugModal";



/*

    The config variable is an object that contains a variables array. Each object in the variables array represents a form field and its configuration. The following properties can be set for each object:

    type: This is the type of the form field. It can be one of the following:

    "input": A simple text input field.
    "input-number": A numeric input field.
    "hardcoded": A field that displays a hardcoded value.
    "select": A dropdown field.
    "multi-select": A dropdown field that allows multiple selections.
    "date-time": A date and time picker field.
    name: This is the name of the form field. It is used as the key when storing the field's value in the state.

    defaultValue: This is the default value of the form field.

    For "select" and "multi-select" types, the following additional properties can be set:

    optionsType: This can be "api" or "hardcoded". If it's "api", the options for the dropdown are fetched from an API. If it's "hardcoded", the options are provided in the options property.

    defaultSelectFirst: If this is true and the field's value is not found in the options, the first option will be selected by default.

    options: If optionsType is "hardcoded", this is an array of objects, each with a value and a label property. If optionsType is "api", this is an object that contains the following properties:

    url: The URL of the API to fetch the options from.
    type: The HTTP method to use for the API request. This can be "get" or "post".
    params: An object that maps parameter names to form field names. The values of these form fields will be sent as parameters in the API request.
    map: An object that maps the label and value properties to the corresponding properties in the API response.
    For "date-time" type, the following additional properties can be set:

    format: The format of the date and time. This is a string that follows the moment.js format.

    showTime: If this is true, a time picker is included in the date picker.

    showHour, showMinute, showSecond: These properties determine whether the hour, minute, and second selectors are shown in the time picker.
*/
export default function MasterReportsTable({
    config = {
        variables: [],
    },
    configId,
    allQuerysUrl,
}) {
    console.log(config);
    const [selected, setSelected] = React.useState(() => {
        const selected = {};
        config?.variables?.forEach((variable) => {
            if (variable?.type === "date-time") {
                selected[variable?.name] = moment().format(variable?.format);
            } else {
                selected[variable?.name] = variable?.defaultValue;
            }
        });
        return selected;
    });
    const setSelectedKey = (key, value) => {
        setSelected((prev) => {
            return {
                ...prev,
                [key]: value,
            };
        });
    };

    const [options, setOptions] = React.useState(() => {
        const options = {};
        config?.variables?.forEach((variable) => {
            if (variable?.optionsType === "api") {
                options[variable?.name] = [];
            } else if (variable?.optionsType === "hardcoded") {
                options[variable?.name] = variable?.options;
            }
        });
        console.log(options);
        return options;
    });
    const [userQueries, setUserQueries] = useState([]);
    const setOptionsKey = (key, value) => {
        console.log(key, value);
        setOptions((prev) => {
            return {
                ...prev,
                [key]: value,
            };
        });
    };
    useEffect(() => {
        console.log("Options", options);
    }, [options]);
    useEffect(() => {
        const fetchQueries = async () => {
            if (config?.variables) {
                console.log("Fetching queries", config?.variables);
                const queries = await Promise.all(
                    config?.variables?.map(async (variable) => {
                        if (variable?.optionsType === "api") {
                            let queryKeyArray = [variable?.name];
                            if (Object?.keys(variable?.options?.params)?.length > 0) {
                                for (const [key, value] of Object.entries(variable?.options?.params)) {
                                    queryKeyArray?.push(selected[value]);
                                }
                            }

                            const paramsOrData = {
                                from: "MasterReportsEditor",
                            };
                            if (Object?.keys(variable?.options?.params)?.length > 0) {
                                for (const [key, value] of Object.entries(variable?.options?.params)) {
                                    if (selected[value] === undefined) {
                                        throw new Error("Value for " + value + " is not selected");
                                    }
                                    paramsOrData[key] = selected[value];
                                }
                            }

                            const reqType = variable?.options?.type || "get";
                            try {
                                const response = await axios({
                                    url: variable?.options?.url,
                                    method: reqType,
                                    params: reqType === "get" ? paramsOrData : {},
                                    data: reqType === "post" ? paramsOrData : {},
                                });

                                let data = response?.data?.data?.map((item) => {
                                    return {
                                        label: item[variable?.options?.map?.label || "label"],
                                        value: item[variable?.options?.map?.value || "value"],
                                    };
                                });
                                console.log({[variable?.name]: data});
                                setOptionsKey([variable?.name], data );

                                const found = data?.find((x) => x?.value === selected[variable?.name]);
                                if (variable?.type === "select" && variable?.defaultSelectFirst && data?.length > 0 && !found) {
                                    setSelected((prev) => ({ ...prev, [variable?.name]: data[0]?.value }));
                                }
                                return data;
                            } catch (error) {
                                    message.error("Error while fetching options for " + variable?.name);
                                // throw error;
                            }
                        }

                        return true;
                    })
                );

                setUserQueries(queries);
            }
        };

        fetchQueries();
    }, [config, selected]);
    // const userQueries = useQueries({
    //     // queries: []
    //     queries:
    //         config?.variables &&
    //         config?.variables?.map((variable) => {
    //             if (variable?.optionsType === "api") {
    //                 let queryKeyArray = [variable?.name];
    //                 if (Object?.keys(variable?.options?.params)?.length > 0) {
    //                     for (const [key, value] of Object.entries(variable?.options?.params)) {
    //                         queryKeyArray?.push(selected[value]);
    //                     }
    //                 }
    //                 // console.log("queryKeyArray", queryKeyArray);
    //                 return {
    //                     queryKey: queryKeyArray,
    //                     queryFn: async () => {
    //                         const paramsOrData = {
    //                             from: "MasterReportsEditor",
    //                         };
    //                         if (Object?.keys(variable?.options?.params)?.length > 0) {
    //                             for (const [key, value] of Object.entries(variable?.options?.params)) {
    //                                 if (selected[value] === undefined) {
    //                                     throw new Error("Value for " + value + " is not selected");
    //                                 }
    //                                 console.log(key, value, selected[value], "INSIDE");
    //                                 paramsOrData[key] = selected[value];
    //                             }
    //                         }

    //                         const reqType = variable?.options?.type || "get";
    //                         try {
    //                             const response = await axios({
    //                                 url: variable?.options?.url,
    //                                 method: reqType,
    //                                 params: reqType === "get" ? paramsOrData : {},
    //                                 data: reqType === "post" ? paramsOrData : {},
    //                             })
    //                                 .then((response) => {
    //                                     return response;
    //                                 })
    //                                 .catch((error) => {
    //                                     message.error("Error while fetching options for " + variable?.name);
    //                                     throw error;
    //                                 });
    //                             let data = response?.data?.data?.map((item) => {
    //                                 return {
    //                                     label: item[variable?.options?.map?.label || "label"],
    //                                     value: item[variable?.options?.map?.value || "value"],
    //                                 };
    //                             });
    //                             setOptionsKey(variable?.name, data);

    //                             // Find the one with value from state ... If its not there then select the first one
    //                             const found = data?.find((x) => x?.value === selected[variable?.name]);
    //                             if (variable?.type === "select" && variable?.defaultSelectFirst && data?.length > 0 && !found) {
    //                                 setSelectedKey(variable?.name, data[0]?.value);
    //                             }
    //                             return data;
    //                         } catch (error) {
    //                             message.error &&
    //                                 message.error("Error while fetching options for " + variable?.name);
    //                             throw error;
    //                         }
    //                     },
    //                 };
    //             }

    //             return true;
    //         }),
    // });

    const renderVariableComponent = (variable) => {
        switch (variable?.type) {
            case "input":
                return (
                    <Input
                        value={selected[variable?.name]}
                        onChange={(e) => setSelectedKey(variable?.name, e?.target?.value)}
                        style={{ width: "200px" }}
                    />
                );
            case "input-number":
                return (
                    <InputNumber
                        value={selected[variable?.name]}
                        onChange={(value) => setSelectedKey(variable?.name, value)}
                        style={{ width: "200px" }}
                    />
                );
            case "hardcoded":
                return <span>{selected[variable?.name]}</span>;
            case "select":
                return (
                    <Select
                        options={options[variable?.name]}
                        value={selected[variable?.name]}
                        onChange={(value) => setSelectedKey(variable?.name, value)}
                        style={{ width: "200px" }}
                        showSearch
                        optionFilterProp="label"
                    />
                );
            case "multi-select":
                return (
                    <Select
                        options={options[variable?.name]}
                        value={selected[variable?.name]}
                        onChange={(value) => setSelectedKey(variable?.name, value)}
                        mode="multiple"
                        style={{ minWidth: "300px" }}
                        showSearch
                        optionFilterProp="label"
                    />
                );
            case "date-time":
                return (
                    <DatePicker
                        value={selected[variable?.name] ? moment(selected[variable?.name], variable?.format) : null}
                        onChange={(e) => setSelectedKey(variable?.name, e?.format(variable?.format))}
                        style={{ width: "200px" }}
                        showTime={variable?.showTime}
                        showHour={variable?.showHour}
                        showMinute={variable?.showMinute}
                        showSecond={variable?.showSecond}
                        allowClear={false}
                    />
                );
            default:
                return null;
        }
    };

    const [masterData, setMasterData] = React.useState([]);
    const [dataLoading, setDataLoading] = React.useState(false);
    const executeAndGetData = async () => {
        setDataLoading(true);
        await axios
            .post("/query-reports/execute-query", {
                config_id: configId || null,
                variables: selected,
                query_details: config,
            })
            .then((response) => {
                setMasterData(response?.data?.data);
                setDataLoading(false);
                message.success(`Fetched ${response.data?.data?.length} rows` || "Fetched 0 rows");
            })
            .catch((error) => {
                setDataLoading(false);
                message.error("Error while fetching data for MasterReportsEditor");
                throw error;
            });
    };

    return (
        <div className="my-form-outer">
            <div className="my-form-header">
                <span className="my-form-title">Report : {config?.name}</span>
                <div className="actions-outer-div" style={{ alignItems: "flex-end" }}>
                    {/* <span><AllQueryReportsSelector allQuerysUrl={allQuerysUrl}/></span> */}
                    <span className="actions-outer-div" id="table-search-box"></span>
                    <DebugModal selected={selected} options={options} config={config} />
                </div>
            </div>
            <div style={{ display: "flex", width: "100%", justifyContent: "space-between", alignItems: "center" }}>
                <div style={{ display: "inline-flex", gap: "10px" }}>
                    {config?.variables &&
                        config?.variables?.map((variable) => {
                            if (variable?.hide) {
                                return null;
                            }
                            return (
                                <InputWithLabel key={variable?.name} label={variable?.name}>
                                    {renderVariableComponent(variable)}
                                </InputWithLabel>
                            );
                        })}
                </div>
                <div className="actions-outer-div">
                    <Button type="primary" danger onClick={executeAndGetData} loading={dataLoading} className="actions-button">
                        <FaSearch /> Search
                    </Button>
                </div>
            </div>
            <CreateTableFromData masterData={masterData} dataLoading={dataLoading}/>
        </div>
    );
}

const CreateTableFromData = ({ masterData, dataLoading }) => {
    const tableKeys = React.useMemo(() => {
        if (masterData?.length === 0) {
            return [];
        }
        return Object.keys(masterData[0]);
    }, [masterData]);

    const [filterOptions, setFilterOptions] = useFilterOptions(masterData, tableKeys);

    const [state, setState] = React.useState(masterData);

    const columns = React.useMemo(() => {
        return tableKeys?.map((key) => {
            return {
                title: key,
                dataIndex: key,
                key: key,
                filters: filterOptions[key],
                onFilter: (value, record) => record[key] === value,
                filterMultiple: true,
                filterSearch: true,
                // ellipsis: true,
                // width: 200,
            };
        });
    }, [tableKeys, filterOptions]);

    return (
        <div>
            <MyPortal id="table-search-box">
                <div className="actions-outer-div" style={{ width: "100%", alignItems: "flex-end" }}>
                    <SearchComponent
                        masterState={masterData}
                        state={state}
                        setState={setState}
                        isLabelInline={false}
                        searchOptions={tableKeys?.map((key) => {
                            return { keyName: key, label: key };
                        })}
                        allowSearchInLabel={true}
                    />
                    <ExportToExcelButton
                        fileName="MasterReportsTable"
                        sheets={[
                            {
                                sheetName: "MasterReportsTable",
                                data: state,
                                columns: columns,
                            },
                        ]}
                        buttonName={
                            <>
                                <SiMicrosoftexcel /> Export to Excel
                            </>
                        }
                        buttonProps={{
                            className: "actions-button",
                        }}
                    />
                </div>
            </MyPortal>
            <Table
                columns={columns}
                loading={dataLoading}
                dataSource={state}
                size="small"
                pagination={{
                    position: ["bottomRight"],
                    showSizeChanger: true,
                    pageSizeOptions: ["10", "20", "50", "100", "200", "500", "1000"],
                    defaultPageSize: 100,
                }}
                scroll={{ x: 2000 }}
            />
        </div>
    );
};

// config = {
//     variables: [
//         // {
//         //     type: "input-number",
//         //     name: "clientId",
//         //     defaultValue: 0,
//         // },
//         {
//             type: "hardcoded",
//             name: "clientId",
//             defaultValue: 0,
//         },
//         // {
//         //     type: "input",
//         //     name: "table",
//         //     defaultValue: "my_table",
//         // },
//         {
//             type: "select",
//             name: "brandId",
//             defaultValue: 0,
//             optionsType: "api",
//             defaultSelectFirst: true,
//             options: {
//                 url: "/masters/brands-by-client-id",
//                 type: "get",
//                 params: {
//                     client_id: "clientId",
//                     // search: "search",
//                     // my_color: "colors",
//                 },
//                 map: {
//                     label: "COMPANY_NAME",
//                     value: "ID",
//                 },
//             },
//         },
// {
//     type: "checkbox",

//     type: "select",
//     name: "showAdvanced",
//     // defaultValue: "5",
// }
//         {
//             type: "select",
//             name: "store_id",
//             defaultValue: 0,
//             defaultSelectFirst: true,
//             optionsType: "api",
//             showSelectorOnUI: "showAdvanced"
//             options: {
//                 url: "/masters/stores-by-brand-id",
//                 type: "get",
//                 params: {
//                     brand_id: "brandId",
// brand_id: {
//     type: "hardcoded",
//     value: "5",
// },
// brand_id: {
//     type: "variable",
//     value: "brandId",
// },
//         },
//         map: {
//             label: "STORE_NAME",
//             value: "ID",
//         },
//     },

// },
//         {
//             type: "multi-select",
//             name: "form_status",
//             defaultValue: [],
//             optionsType: "hardcoded",
//             options: [
//                 { value: "submitted", label: "Submitted" },
//                 { value: "approved", label: "Approved" },
//                 { value: "open", label: "Open" },
//                 { value: "wip", label: "WIP" },
//             ],
//         },
//         {
//             type: "date-time",
//             name: "from_date",
//             format: "YYYY-MM-DD",
//             defaultValue: null,
//             showTime: false,
//             // showHour: false,
//             // showMinute: false,
//             // showSecond: false,
//         },
//         {
//             type: "date-time",
//             name: "to_date",
//             format: "YYYY-MM-DD HH:mm:ss",
//             defaultValue: null,
//             showTime: true,
//             // showHour: false,
//             // showMinute: false,
//             // showSecond: false,
//         },
//     ],
// },

{
    /* <decodeURIComponent
    config: {
        variable: ,
        query,
        name,
        desc
    }
    setConfig: [

    ]

    onSave, 
/>

<render 
    config,
    apiUrl: "/asas"

    

/>


backed =>  */
}

