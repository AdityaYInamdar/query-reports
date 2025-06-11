import { useQueries, useQuery } from "@tanstack/react-query";
import {
  Affix,
  Button,
  Card,
  Checkbox,
  Col,
  DatePicker,
  Drawer,
  Input,
  InputNumber,
  message,
  Modal,
  Popconfirm,
  Popover,
  Row,
  Select,
  Space,
  Table,
  Tabs,
} from "antd";
import TabPane from "antd/lib/tabs/TabPane";
import axios from "axios";
import moment from "moment";
import React, { useEffect, useMemo } from "react";
import { CiEdit, CiSettings } from "react-icons/ci";
import {
  FaArrowDown,
  FaArrowUp,
  FaBug,
  FaPlus,
  FaSearch,
  FaTrash,
} from "react-icons/fa";
import { SiMicrosoftexcel } from "react-icons/si";
import InfiniteScroll from "react-infinite-scroll-component";
import ReactJson from "react-json-view";
import { useParams } from "react-router-dom";
import { ExportToExcelButton } from "./Components/ExportToExcel";
import InputWithLabel from "./Components/InputWithLabel";
import MyPortal from "./Components/MyPortal";
import SearchComponent from "./Components/SearchComponent";
import useDebounce from "./Components/useDebounce";
import useFilterOptions from "./Components/useFilterOptions";
import { useWindowSize } from "./Components/useWindowResize";

export function QueryReports() {
  const [selectedReport, setSelectedReport] = React.useState(null);
  const [refetch, setRefetch] = React.useState(0);
  const { data: allQueryReports, isLoading: allQueryReportsLoading } = useQuery(
    {
      queryKey: ["allQueryReports", refetch],
      queryFn: async () => {
        const response = await axios({
          url: "/qr/get-all-query-reports",
          method: "get",
        })
          .then((response) => {
            return response;
          })
          .catch((error) => {
            error.handleGlobally("Error while fetching allQueryReports");
            // throw error;
          });
        let data = response?.data?.data?.map((item) => {
          return {
            ...item,
            label: item?.name,
            value: item?.query_report_id,
          };
        });
        setSelectedReport(data[0]?.value);
        return data;
      },
      refetchOnWindowFocus: false,
    }
  );

  return allQueryReportsLoading ? (
    <div>Loading...</div>
  ) : (
    <>
      <MyPortal id="navbar-portal-demo">
        <InputWithLabel label="Select Report" isInline={true}>
          <Select
            options={allQueryReports}
            value={selectedReport}
            onChange={(value) => setSelectedReport(value)}
            style={{ width: "200px" }}
            showSearch
            optionFilterProp="label"
          />
        </InputWithLabel>
        <QueriesHandler options={allQueryReports} setRefetch={setRefetch} />
      </MyPortal>
      {selectedReport && <CreateReportFromConfig configId={selectedReport} />}
    </>
  );
}

export function CreateReportFromConfigWrapper() {
  const configId = useParams()?.configId;

  return <CreateReportFromConfig configId={configId} />;
}

export function useConfigById(configId = 0, isAddNew = false) {
  const { data, isLoading, error } = useQuery({
    queryKey: ["MasterReportsEditor", configId],
    queryFn: async () => {
      if (isAddNew || configId === 0) {
        return {
          name: "",
          description: "",
          query: "",
          variables: [
            {
              name: "",
              type: "",
              defaultValue: "",
              optionsType: "",
              defaultSelectFirst: false,
            },
          ],
        };
      }
      const response = await axios({
        url: "/qr/get-config-by-id",
        method: "get",
        params: {
          config_id: configId,
        },
      })
        .then((response) => {
          return response;
        })
        .catch((error) => {
          error.handleGlobally(
            "Error while fetching config for MasterReportsEditor"
          );
          // throw error;
        });
      return response?.data?.data;
    },
  });

  return { data, isLoading, error };
}

export function CreateReportFromConfig({ configId }) {
  const {
    data: config,
    isLoading: configLoading,
    error,
  } = useConfigById(configId);
  return configLoading ? (
    <div>Loading...</div>
  ) : error ? (
    <div>Error</div>
  ) : (
    <MasterReportsTable config={config} configId={configId} />
  );
}

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
  showSearch = true,
  configId,
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
    return options;
  });
  const setOptionsKey = (key, value) => {
    setOptions((prev) => {
      return {
        ...prev,
        [key]: value,
      };
    });
  };
  console.log(config.variables);
  const userQueries = useQueries({
    // queries: []
    queries:
      config?.variables &&
      config?.variables?.map((variable) => {
        if (variable?.optionsType === "api") {
          let queryKeyArray = [variable?.name];
          if (Object?.keys(variable?.options?.params)?.length > 0) {
            for (const [key, value] of Object.entries(
              variable?.options?.params
            )) {
              queryKeyArray?.push(selected[value]);
            }
          }
          // console.log("queryKeyArray", queryKeyArray);
          return {
            queryKey: queryKeyArray,
            queryFn: async () => {
              const paramsOrData = {
                from: "MasterReportsEditor",
              };
              if (Object?.keys(variable?.options?.params)?.length > 0) {
                for (const [key, value] of Object.entries(
                  variable?.options?.params
                )) {
                  if (selected[value] === undefined) {
                    throw new Error("Value for " + value + " is not selected");
                  }
                  console.log(key, value, selected[value], "INSIDE");
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
                })
                  .then((response) => {
                    return response;
                  })
                  .catch((error) => {
                    error.handleGlobally(
                      "Error while fetching options for " + variable?.name
                    );
                    // throw error;
                  });
                let data = response?.data?.data?.map((item) => {
                  return {
                    label: item[variable?.options?.map?.label || "label"],
                    value: item[variable?.options?.map?.value || "value"],
                  };
                });
                setOptionsKey(variable?.name, data);

                // Find the one with value from state ... If its not there then select the first one
                const found = data?.find(
                  (x) => x?.value === selected[variable?.name]
                );
                if (
                  variable?.type === "select" &&
                  variable?.defaultSelectFirst &&
                  data?.length > 0 &&
                  !found
                ) {
                  setSelectedKey(variable?.name, data[0]?.value);
                }
                return data;
              } catch (error) {
                error.handleGlobally &&
                  error.handleGlobally(
                    "Error while fetching options for " + variable?.name
                  );
                // throw error;
              }
            },
          };
        }

        return true;
      }),
  });

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
            value={
              selected[variable?.name]
                ? moment(selected[variable?.name], variable?.format)
                : null
            }
            onChange={(e) =>
              setSelectedKey(variable?.name, e?.format(variable?.format))
            }
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
      .post("/qr/execute-query", {
        config_id: configId || null,
        variables: selected,
        query_details: config,
      })
      .then((response) => {
        setMasterData(response?.data?.data);
        setDataLoading(false);
        message.success(
          `Fetched ${response.data?.data?.length} rows` || "Fetched 0 rows"
        );
      })
      .catch((error) => {
        setDataLoading(false);
        error.handleGlobally(
          "Error while fetching data for MasterReportsEditor"
        );
        // throw error;
      });
  };

  return (
    <div className="my-form-outer">
      <div className="my-form-header">
        <span className="my-form-title">Report : {config?.name}</span>
        <div className="actions-outer-div" style={{ alignItems: "flex-end" }}>
          <span className="actions-outer-div" id="table-search-box"></span>
          <DebugModal selected={selected} options={options} config={config} />
        </div>
      </div>
      <div
        style={{
          display: "flex",
          width: "100%",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <div style={{ display: "inline-flex", gap: "10px" }}>
          {config.variables &&
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
          <Button
            type="primary"
            danger
            onClick={executeAndGetData}
            loading={dataLoading}
            className="actions-button"
          >
            <FaSearch /> Search
          </Button>
        </div>
      </div>
      <CreateTableFromData
        masterData={masterData}
        dataLoading={dataLoading}
        showSearch={showSearch}
      />
    </div>
  );
}

const CreateTableFromData = ({
  masterData,
  dataLoading,
  showSearch = true,
}) => {
  const tableKeys = React.useMemo(() => {
    if (masterData?.length === 0) {
      return [];
    }
    return Object.keys(masterData[0]);
  }, [masterData]);

  const [filterOptions, setFilterOptions] = useFilterOptions(
    masterData,
    tableKeys
  );

  const [state, setState] = React.useState(masterData);

  React.useEffect(() => {
    setState(masterData);
  }, [masterData]);

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
      {showSearch && (
        <MyPortal id="table-search-box">
          <div
            className="actions-outer-div"
            style={{ width: "100%", alignItems: "flex-end" }}
          >
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
      )}
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

export function RenderVariables({
  record,
  isAddNew = false,
  options,
  setRefetch,
  open,
  onClose,
  width,
  height,
}) {
  const {
    data: config,
    isLoading: configLoading,
    error,
  } = useConfigById(record?.query_report_id, isAddNew);
  console.log(config);
  const [queryConsole, setQueryConsole] = React.useState({
    visible: false,
    query: "",
  });
  console.log(config);
  const [queryDetails, setQueryDetails] = React.useState({
    query: "",
    name: "",
    description: "",
    variables: [
      {
        name: "",
        type: "",
        defaultValue: "",
        optionsType: "",
        defaultSelectFirst: false,
      },
    ],
  });
  const [optionsKey, setOptionsKey] = React.useState([]);
  const [loading, setLoading] = React.useState(false);
  function extractVariables(query) {
    // if query doesnt start with select then return
    const regex = /(?:IN\s*)?{([^{}]+)}(?:\s*IN)?/gi;
    const matches = new Set();
    let match;

    while ((match = regex.exec(query)) !== null) {
      matches.add(match[1]);
    }
    var list = [...matches];
    let variables = [];
    queryDetails?.variables?.length > 0 &&
      queryDetails?.variables?.forEach((variable) => {
        if (matches.has(variable?.name)) {
          variables.push(variable);
          list.splice(list.indexOf(variable?.name), 1);
        }
      });
    list.map((match) => {
      const isMultiSelect =
        query.includes(`IN {${match}}`) || query.includes(`in {${match}}`);
      variables.push({
        key: match,
        name: match,
        type: isMultiSelect ? "multi-select" : undefined,
      });
    });
    if (!variables?.length) {
      message.info("No Variables Found");
    }
    return { extracted: variables, message: "Extracted" };
  }
  const queryChangeHandler = (e) => {
    const { extracted, message } = extractVariables(e);
    setQueryDetails((prev) => ({
      ...prev,
      query: e,
      variables: [
        // ...(prev.variables && typeof prev.variables[Symbol.iterator] === "function" ? prev.variables : []),
        ...(extracted && typeof extracted[Symbol.iterator] === "function"
          ? extracted
          : []),
      ],
    }));

    console.log(extracted);
  };
  React.useEffect(() => {
    if (config) {
      setQueryDetails((prev) => ({
        ...prev,
        ...config,
      }));
    }
  }, [config]);
  function deleteVariable(index) {
    setQueryDetails((prev) => {
      return {
        ...prev,
        variables: [
          ...prev.variables.slice(0, index),
          ...prev.variables.slice(index + 1),
        ],
      };
    });
  }
  const variableTypes = [
    "input",
    "input-number",
    "select",
    "multi-select",
    "date-time",
    "hardcoded",
  ];
  const addOption = (index) => {
    setQueryDetails((prev) => {
      return {
        ...prev,
        variables: [
          ...prev.variables.slice(0, index),
          {
            ...prev.variables[index],
            options: [
              ...prev.variables[index]?.options,
              {
                label: "",
                value: "",
              },
            ],
          },
          ...prev.variables.slice(index + 1),
        ],
      };
    });
  };
  const deleteOption = (index, i) => {
    console.log(index, i);
    const optionsArray = [...queryDetails?.variables[index]?.options];
    optionsArray.splice(i, 1);
    setQueryDetails((prev) => {
      const updatedVariables = [...prev.variables];
      updatedVariables[index] = {
        ...updatedVariables[index],
        options: optionsArray,
      };
      return {
        ...prev,
        variables: updatedVariables,
      };
    });
  };
  useEffect(() => {
    console.log(queryDetails);
  }, [queryDetails]);
  const restrictedKeywords = [
    "DELETE",
    "DROP",
    "UPDATE",
    "INSERT",
    "CREATE",
    "ALTER",
    "TRUNCATE",
    "RENAME",
    "GRANT",
    "REVOKE",
    "COMMIT",
    "ROLLBACK",
    "SAVEPOINT",
    "SET",
    "LOCK",
    "UNLOCK",
    "MERGE",
  ];
  function changeParamFlag(index, checked) {
    setQueryDetails((prev) => ({
      ...prev,
      variables: [
        ...prev.variables.slice(0, index),
        {
          ...prev.variables[index],

          options: {
            ...prev.variables[index]?.options,
            is_params: checked,
          },
        },
        ...prev.variables.slice(index + 1),
      ],
    }));
  }
  function addParam(index) {
    if (
      Object.keys(queryDetails?.variables?.[index]?.options?.params)?.length ===
      0
    ) {
      setQueryDetails((prev) => ({
        ...prev,
        variables: [
          ...prev.variables.slice(0, index),
          {
            ...prev.variables[index],
            options: {
              ...prev.variables[index]?.options,
              paramsType: [""],
              params: {
                "": "",
              },
            },
          },
          ...prev.variables.slice(index + 1),
        ],
      }));
    } else if (
      Object.keys(queryDetails?.variables?.[index]?.options?.params)?.filter(
        (x) => x === ""
      ).length > 0
    ) {
      return;
    } else {
      setQueryDetails((prev) => ({
        ...prev,
        variables: [
          ...prev.variables.slice(0, index),
          {
            ...prev.variables[index],
            options: {
              ...prev.variables[index]?.options,
              paramsType:
                typeof prev.variables[index]?.options?.paramsType === "object"
                  ? [...prev.variables[index]?.options?.paramsType, ""]
                  : [""],
              params: {
                ...prev.variables[index]?.options?.params,

                "": "",
              },
            },
          },
          ...prev.variables.slice(index + 1),
        ],
      }));
    }
  }

  async function saveQueryDetails(id) {
    if (
      !queryDetails?.query
        .replace(/\s/g, "")
        ?.toLowerCase()
        ?.startsWith("select")
    ) {
      message.error("Query should start with SELECT");
      return;
    }
    const containsRestrictedKeyword = restrictedKeywords.some((keyword) =>
      queryDetails?.query?.toUpperCase().split(" ").includes(keyword)
    );
    if (containsRestrictedKeyword) {
      message.error(`Query contains restricted keywords`);
      return;
    }
    if (isAddNew) {
      axios({
        url: "/qr/add-query-report",
        method: "post",
        data: {
          ...queryDetails,
        },
      })
        .then((response) => {
          message.success("Query added successfully");
          setRefetch((prev) => prev + 1);
        })
        .catch((error) => {
          error.handleGlobally("Error while adding query");
          // throw error;
        });
    } else {
      axios({
        url: "/qr/update-query-report",
        method: "post",
        params: {
          config_id: id,
        },
        data: {
          ...queryDetails,
        },
      })
        .then((response) => {
          message.success("Query updated successfully");
          setRefetch((prev) => prev + 1);
        })
        .catch((error) => {
          error.handleGlobally("Error while updating query");
          // throw error;
        });
    }
  }
  function deleteParam(index, i) {
    const paramsArray = Object.keys(
      queryDetails?.variables[index]?.options?.params
    );
    const paramsTypeArray = queryDetails?.variables[index]?.options?.paramsType;
    paramsArray.splice(i, 1);
    paramsTypeArray.splice(i, 1);
    setQueryDetails((prev) => {
      const updatedVariables = [...prev.variables];
      updatedVariables[index] = {
        ...updatedVariables[index],
        options: {
          ...updatedVariables[index]?.options,
          params: paramsArray,
          paramsType: paramsTypeArray,
        },
      };
      return {
        ...prev,
        variables: updatedVariables,
      };
    });
  }
  function renderParamsByType(variable, index, i, option) {
    // switch (variable?.options?.paramsType?.[i]) {
    //     case "hardcoded": {
    //         return (
    //             <div>
    //                 <div key={i} style={{ display: "flex", alignItems: "flex-end", gap: "10px" }}>
    //                     <span style={{ display: "flex", flexDirection: "column" }}>
    //                         <b>Param Name</b>
    //                         <Input
    //                             value={option}
    //                             onChange={(e) => {
    //                                 var jsonArray = Object.keys(variable?.options?.params).map((key) => ({
    //                                     key: key,
    //                                     value: variable?.options?.params[key],
    //                                 }));
    //                                 jsonArray = [
    //                                     ...jsonArray.slice(0, i),
    //                                     {
    //                                         key: e?.target?.value,
    //                                         value: variable?.options?.params[option],
    //                                     },
    //                                     ...jsonArray.slice(i + 1),
    //                                 ];
    //                                 const reconstructedJsonObject = jsonArray.reduce((acc, item) => {
    //                                     acc[item.key] = item.value;
    //                                     return acc;
    //                                 }, {});

    //                                 setQueryDetails((prev) => ({
    //                                     ...prev,
    //                                     variables: [
    //                                         ...prev.variables.slice(0, index),
    //                                         {
    //                                             ...prev.variables[index],
    //                                             options: {
    //                                                 ...prev.variables[index]?.options,
    //                                                 params: reconstructedJsonObject,
    //                                             },
    //                                         },
    //                                         ...prev.variables.slice(index + 1),
    //                                     ],
    //                                 }));
    //                             }}
    //                             style={{ width: "100%" }}
    //                             placeholder="Label"
    //                             size="small"
    //                         />
    //                     </span>
    //                     <span style={{ display: "flex", flexDirection: "column" }}>
    //                         <b>Value</b>
    //                         <Input
    //                             value={variable?.options?.params?.[option]}
    //                             onChange={(e) =>
    //                                 //my variables json, i want to set the params key to the value of the input
    //                                 // {
    //                                 //     "type": "select",
    //                                 //     "name": "client_id",
    //                                 //     "defaultValue": 0,
    //                                 //     "optionsType": "api",
    //                                 //     "defaultSelectFirst": true,
    //                                 //     "options": {
    //                                 //       "url": "/masters/clients",
    //                                 //       "type": "get",
    //                                 //       "params": {

    //                                 //       },
    //                                 //       "map": {
    //                                 //         "label": "COMPANY_NAME",
    //                                 //         "value": "ID"
    //                                 //       }
    //                                 //     }
    //                                 //   },
    //                                 setQueryDetails((prev) => ({
    //                                     ...prev,
    //                                     variables: [
    //                                         ...prev.variables.slice(0, index),
    //                                         {
    //                                             ...prev.variables[index],
    //                                             options: {
    //                                                 ...prev.variables[index]?.options,
    //                                                 params: {
    //                                                     ...prev.variables[index]?.options?.params,
    //                                                     [option]: e?.target?.value,
    //                                                 },
    //                                             },
    //                                         },
    //                                         ...prev.variables.slice(index + 1),
    //                                     ],
    //                                 }))
    //                             }
    //                             style={{ width: "100%" }}
    //                             placeholder="Value"
    //                             size="small"
    //                         />
    //                     </span>
    //                     <Button
    //                         size="small"
    //                         type="dashed"
    //                         danger
    //                         title="Delete Option"
    //                         onClick={() => deleteParam(index, i)}
    //                         icon={<FaTrash />}
    //                     />
    //                 </div>
    //             </div>
    //         );
    //     }
    //     case "derived": {
    return (
      <div>
        <div
          key={i}
          style={{ display: "flex", alignItems: "flex-end", gap: "10px" }}
        >
          <span style={{ display: "flex", flexDirection: "column" }}>
            <b>Param Name</b>
            <Input
              value={option}
              onChange={(e) => {
                var jsonArray = Object.keys(variable?.options?.params).map(
                  (key) => ({
                    key: key,
                    value: variable?.options?.params[key],
                  })
                );
                jsonArray = [
                  ...jsonArray.slice(0, i),
                  {
                    key: e?.target?.value,
                    value: variable?.options?.params[option],
                  },
                  ...jsonArray.slice(i + 1),
                ];
                const reconstructedJsonObject = jsonArray.reduce(
                  (acc, item) => {
                    acc[item.key] = item.value;
                    return acc;
                  },
                  {}
                );

                setQueryDetails((prev) => ({
                  ...prev,
                  variables: [
                    ...prev.variables.slice(0, index),
                    {
                      ...prev.variables[index],
                      options: {
                        ...prev.variables[index]?.options,
                        params: reconstructedJsonObject,
                      },
                    },
                    ...prev.variables.slice(index + 1),
                  ],
                }));
              }}
              style={{ width: "150px" }}
              placeholder="Label"
              size="small"
            />
          </span>
          <InputWithLabel label="Value">
            <Select
              value={variable?.options?.params?.[option]}
              options={queryDetails?.variables?.map((v) => {
                if (v?.name === variable?.name) {
                  return {
                    label: v?.name,
                    value: v?.name,
                    disabled: true,
                  };
                }
                return {
                  label: v?.name,
                  value: v?.name,
                };
              })}
              onChange={(e) =>
                setQueryDetails((prev) => ({
                  ...prev,
                  variables: [
                    ...prev.variables.slice(0, index),
                    {
                      ...prev.variables[index],
                      options: {
                        ...prev.variables[index]?.options,
                        params: {
                          ...prev.variables[index]?.options?.params,
                          [option]: e,
                        },
                      },
                    },
                    ...prev.variables.slice(index + 1),
                  ],
                }))
              }
              style={{ width: "150px" }}
              placeholder="Value"
              size="small"
            />
          </InputWithLabel>
          <Button
            size="small"
            type="dashed"
            danger
            title="Delete Option"
            onClick={() => deleteParam(index, i)}
            icon={<FaTrash />}
          />
        </div>
      </div>
    );
    //     }
    // }
  }
  function renderParamsOptions(variable, index) {
    if (!variable?.options?.is_params || !variable?.options?.paramsType) {
      return null;
    }
    return (
      Object.keys(variable?.options?.paramsType).length > 0 &&
      Object.keys(variable?.options?.params)?.map((option, i) => (
        <div
          key={i}
          style={{ display: "flex", alignItems: "center", gap: "10px" }}
        >
          {/* <span style={{ display: "flex", flexDirection: "column" }}>
                        <b>Param Type</b>
                        <Select
                            options={[
                                { label: "Hardcoded", value: "hardcoded" },
                                { label: "Derived", value: "derived" },
                            ]}
                            value={variable?.options?.paramsType?.[i]}
                            onChange={(value) =>
                                setQueryDetails((prev) => ({
                                    ...prev,
                                    variables: [
                                        ...prev.variables.slice(0, index),
                                        {
                                            ...prev.variables[index],
                                            options: {
                                                ...prev.variables[index]?.options,
                                                paramsType: [
                                                    ...prev.variables[index]?.options?.paramsType?.slice(0, i),
                                                    value,
                                                    ...prev.variables[index]?.options?.paramsType?.slice(i + 1),
                                                ],
                                            },
                                        },
                                        ...prev.variables.slice(index + 1),
                                    ],
                                }))
                            }
                            style={{ width: "100px" }}
                        />
                    </span> */}
          {renderParamsByType(variable, index, i, option)}
        </div>
      ))
    );
    // switch (variable?.options?.paramsType) {
    //     case "hardcoded": {
    //         return (
    //             <div style={{ marginLeft: "20px" }}>
    //                 {Object.keys(variable?.options?.params).length &&
    //                     Object.keys(variable?.options?.params)?.map((option, i) => (
    //                         <div key={i} style={{ display: "flex", alignItems: "center", gap: "10px" }}>
    //                             <Input
    //                                 value={option}
    //                                 onChange={(e) => {
    //                                     var jsonArray = Object.keys(variable?.options?.params).map((key) => ({
    //                                         key: key,
    //                                         value: variable?.options?.params[key],
    //                                     }));
    //                                     jsonArray = [
    //                                         ...jsonArray.slice(0, i),
    //                                         {
    //                                             key: e?.target?.value,
    //                                             value: variable?.options?.params[option],
    //                                         },
    //                                         ...jsonArray.slice(i + 1),
    //                                     ];
    //                                     const reconstructedJsonObject = jsonArray.reduce((acc, item) => {
    //                                         acc[item.key] = item.value;
    //                                         return acc;
    //                                     }, {});

    //                                     setQueryDetails((prev) => ({
    //                                         ...prev,
    //                                         variables: [
    //                                             ...prev.variables.slice(0, index),
    //                                             {
    //                                                 ...prev.variables[index],
    //                                                 options: {
    //                                                     ...prev.variables[index]?.options,
    //                                                     params: reconstructedJsonObject,
    //                                                 },
    //                                             },
    //                                             ...prev.variables.slice(index + 1),
    //                                         ],
    //                                     }));
    //                                 }}
    //                                 style={{ width: "100%" }}
    //                                 placeholder="Label"
    //                                 size="small"
    //                             />
    //                             <Input
    //                                 value={variable?.options?.params?.[option]}
    //                                 onChange={(e) =>
    //                                     //my variables json, i want to set the params key to the value of the input
    //                                     // {
    //                                     //     "type": "select",
    //                                     //     "name": "client_id",
    //                                     //     "defaultValue": 0,
    //                                     //     "optionsType": "api",
    //                                     //     "defaultSelectFirst": true,
    //                                     //     "options": {
    //                                     //       "url": "/masters/clients",
    //                                     //       "type": "get",
    //                                     //       "params": {

    //                                     //       },
    //                                     //       "map": {
    //                                     //         "label": "COMPANY_NAME",
    //                                     //         "value": "ID"
    //                                     //       }
    //                                     //     }
    //                                     //   },
    //                                     setQueryDetails((prev) => ({
    //                                         ...prev,
    //                                         variables: [
    //                                             ...prev.variables.slice(0, index),
    //                                             {
    //                                                 ...prev.variables[index],
    //                                                 options: {
    //                                                     ...prev.variables[index]?.options,
    //                                                     params: {
    //                                                         ...prev.variables[index]?.options?.params,
    //                                                         [option]: e?.target?.value,
    //                                                     },
    //                                                 },
    //                                             },
    //                                             ...prev.variables.slice(index + 1),
    //                                         ],
    //                                     }))
    //                                 }
    //                                 style={{ width: "100%" }}
    //                                 placeholder="Value"
    //                                 size="small"
    //                             />
    //                             <Button
    //                                 size="small"
    //                                 type="dashed"
    //                                 danger
    //                                 title="Delete Option"
    //                                 onClick={() => deleteParam(index, i)}
    //                                 icon={<FaTrash />}
    //                             />
    //                         </div>
    //                     ))}
    //             </div>
    //         );
    //     }
    //     case "derived": {
    //         return (
    //             <div>
    //                 {Object.keys(variable?.options?.params).length &&
    //                     Object.keys(variable?.options?.params)?.map((option, i) => (
    //                         <div key={i} style={{ display: "flex", alignItems: "center", gap: "10px" }}>

    //                             <Input
    //                                 value={option}
    //                                 onChange={(e) => {
    //                                     var jsonArray = Object.keys(variable?.options?.params).map((key) => ({
    //                                         key: key,
    //                                         value: variable?.options?.params[key],
    //                                     }));
    //                                     jsonArray = [
    //                                         ...jsonArray.slice(0, i),
    //                                         {
    //                                             key: e?.target?.value,
    //                                             value: variable?.options?.params[option],
    //                                         },
    //                                         ...jsonArray.slice(i + 1),
    //                                     ];
    //                                     const reconstructedJsonObject = jsonArray.reduce((acc, item) => {
    //                                         acc[item.key] = item.value;
    //                                         return acc;
    //                                     }, {});

    //                                     setQueryDetails((prev) => ({
    //                                         ...prev,
    //                                         variables: [
    //                                             ...prev.variables.slice(0, index),
    //                                             {
    //                                                 ...prev.variables[index],
    //                                                 options: {
    //                                                     ...prev.variables[index]?.options,
    //                                                     params: reconstructedJsonObject,
    //                                                 },
    //                                             },
    //                                             ...prev.variables.slice(index + 1),
    //                                         ],
    //                                     }));
    //                                 }}
    //                                 style={{ width: "100%" }}
    //                                 placeholder="Label"
    //                                 size="small"
    //                             />
    //                             <Select
    //                                 value={variable?.options?.params?.[option]}
    //                                 options={queryDetails?.variables?.map((v) => {
    //                                     if (v?.name === variable?.name) {
    //                                         return {
    //                                             label: v?.name,
    //                                             value: v?.name,
    //                                             disabled: true,
    //                                         };
    //                                     }
    //                                     return {
    //                                         label: v?.name,
    //                                         value: v?.name,
    //                                     };
    //                                 })}
    //                                 onChange={(e) =>
    //                                     setQueryDetails((prev) => ({
    //                                         ...prev,
    //                                         variables: [
    //                                             ...prev.variables.slice(0, index),
    //                                             {
    //                                                 ...prev.variables[index],
    //                                                 options: {
    //                                                     ...prev.variables[index]?.options,
    //                                                     params: {
    //                                                         ...prev.variables[index]?.options?.params,
    //                                                         [option]: e,
    //                                                     },
    //                                                 },
    //                                             },
    //                                             ...prev.variables.slice(index + 1),
    //                                         ],
    //                                     }))
    //                                 }
    //                                 style={{ width: "100%" }}
    //                                 placeholder="Value"
    //                                 size="small"
    //                             />
    //                             <Button
    //                                 size="small"
    //                                 type="dashed"
    //                                 danger
    //                                 title="Delete Option"
    //                                 onClick={() => deleteParam(index, i)}
    //                                 icon={<FaTrash />}
    //                             />
    //                         </div>
    //                     ))}
    //             </div>
    //         );
    //     }
    // }
  }

  function renderDefaultValue(variable, index) {
    switch (variable?.type) {
      case "input":
        return (
          <InputWithLabel label="Default Value">
            <Input
              value={variable?.defaultValue}
              onChange={(e) =>
                setQueryDetails((prev) => ({
                  ...prev,
                  variables: [
                    ...prev.variables.slice(0, index),
                    {
                      ...prev.variables[index],
                      defaultValue: e?.target?.value,
                    },
                    ...prev.variables.slice(index + 1),
                  ],
                }))
              }
              style={{ width: 100 }}
            />
          </InputWithLabel>
        );
      case "input-number":
        return (
          <InputWithLabel label="Default Value">
            <InputNumber
              value={variable?.defaultValue}
              onChange={(value) =>
                setQueryDetails((prev) => ({
                  ...prev,
                  variables: [
                    ...prev.variables.slice(0, index),
                    {
                      ...prev.variables[index],
                      defaultValue: value,
                    },
                    ...prev.variables.slice(index + 1),
                  ],
                }))
              }
              style={{ width: 100 }}
            />
          </InputWithLabel>
        );
    }
  }

  function renderAPIParamsOptions(variable, index) {
    return (
      <>
        <div style={{ display: "flex", gap: "10px", alignItems: "flex-end" }}>
          <span style={{ display: "flex", flexDirection: "column" }}>
            <b>Method</b>
            <Select
              options={[
                { label: "Get", value: "get" },
                { label: "Post", value: "post" },
              ]}
              value={variable?.options.type}
              onChange={(e) => {
                e === "post" && addParam(index);
                setQueryDetails((prev) => ({
                  ...prev,
                  variables: [
                    ...prev.variables.slice(0, index),
                    {
                      ...prev.variables[index],
                      options: {
                        ...prev.variables[index]?.options,
                        type: e,
                        is_params: e === "post" ? true : false,
                      },
                    },
                    ...prev.variables.slice(index + 1),
                  ],
                }));
              }}
              style={{ width: "100px" }}
            />
          </span>
          <span style={{ display: "flex", flexDirection: "column" }}>
            <b>Request URL</b>
            <Input
              placeholder="URL"
              value={variable?.options?.url}
              onChange={(e) =>
                setQueryDetails((prev) => ({
                  ...prev,
                  variables: [
                    ...prev.variables.slice(0, index),
                    {
                      ...prev.variables[index],
                      options: {
                        ...prev.variables[index]?.options,
                        url: e?.target?.value,
                      },
                    },
                    ...prev.variables.slice(index + 1),
                  ],
                }))
              }
              style={{ width: "150px" }}
            />
          </span>
          <Checkbox
            onChange={(e) => changeParamFlag(index, e.target.checked)}
            size="small"
            checked={variable?.options?.is_params}
            // icon={<FaPlus />}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "5px",
              marginBottom: "10px",
            }}
          >
            Add Params?
          </Checkbox>
        </div>
        {variable?.options?.is_params && (
          <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
            <Button
              type="dashed"
              onClick={() => addParam(index)}
              size="small"
              icon={<FaPlus />}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "5px",
                marginBottom: "10px",
                maxWidth: "100px",
              }}
            >
              Add Option
            </Button>
          </div>
        )}
        {renderParamsOptions(variable, index)}
      </>
    );
  }
  function renderSelectTypeOptions(variable, index) {
    switch (variable?.optionsType) {
      case "api":
        return (
          <div
            style={{ display: "flex", flexDirection: "column", gap: "10px" }}
          >
            {renderAPIParamsOptions(variable, index)}
            <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
              <Button
                type="primary"
                onClick={() => {
                  console.log(
                    variable?.options?.is_params,
                    variable?.options?.paramsType
                  );
                  setLoading(true);
                  axios({
                    url: variable?.options?.url,
                    method: variable?.options?.type,
                    params:
                      variable?.options?.is_params &&
                      variable?.options?.paramsType?.length
                        ? Object.keys(variable?.options?.params)
                            .map((key) => ({
                              key: key,
                              value:
                                queryDetails?.variables?.find(
                                  (x) => x.name === key
                                )?.defaultValue || 1,
                            }))
                            .reduce((acc, item) => {
                              acc[item.key] = item.value;
                              return acc;
                            }, {})
                        : variable?.options?.params,
                  })
                    .then((response) => {
                      const data = response?.data?.data;
                      if (data?.length > 0) {
                        setOptionsKey((prev) => ({
                          ...prev,
                          [variable?.name]: Object.entries(data[0]).map(
                            ([key, value]) => {
                              return {
                                key: key,
                                value: key,
                              };
                            }
                          ),
                        }));
                      }
                      setLoading(false);
                    })
                    .catch((error) => {
                      setLoading(false);
                      error.handleGlobally(
                        "Error while fetching options for " + variable?.name
                      );
                      // throw error;
                    });
                }}
              >
                Fetch Options
              </Button>
            </div>
            <div
              style={{
                display: "flex",
                gap: "10px",
                alignItems: "center",
                flexFlow: "wrap",
              }}
            >
              <span style={{ display: "inline-flex", alignItems: "center" }}>
                <b style={{ marginRight: "10px" }}>Label</b>
                <Select
                  placeholder="Options Label"
                  loading={loading}
                  options={optionsKey?.[variable?.name] || []}
                  value={variable?.options?.map?.label}
                  onChange={(value) =>
                    setQueryDetails((prev) => ({
                      ...prev,
                      variables: [
                        ...prev.variables.slice(0, index),
                        {
                          ...prev.variables[index],
                          options: {
                            ...prev.variables[index]?.options,
                            map: {
                              ...prev.variables[index]?.options.map,
                              label: value,
                            },
                          },
                        },
                        ...prev.variables.slice(index + 1),
                      ],
                    }))
                  }
                  style={{ width: 200 }}
                />
              </span>
              <span style={{ display: "inline-flex", alignItems: "center" }}>
                <b style={{ marginRight: "10px" }}>Value</b>
                <Select
                  placeholder="Options Value"
                  options={optionsKey?.[variable?.name] || []}
                  loading={loading}
                  value={variable?.options?.map?.value}
                  onChange={(value) =>
                    setQueryDetails((prev) => ({
                      ...prev,
                      variables: [
                        ...prev.variables.slice(0, index),
                        {
                          ...prev.variables[index],
                          options: {
                            ...prev.variables[index]?.options,
                            map: {
                              ...prev.variables[index]?.options.map,
                              value: value,
                            },
                          },
                        },
                        ...prev.variables.slice(index + 1),
                      ],
                    }))
                  }
                  style={{ width: 200 }}
                />
              </span>
              {variable?.type !== "multi-select" && (
                <Checkbox
                  checked={variable?.defaultSelectFirst}
                  onChange={(e) => {
                    setQueryDetails((prev) => ({
                      ...prev,
                      variables: [
                        ...prev.variables.slice(0, index),
                        {
                          ...prev.variables[index],
                          defaultSelectFirst: e.target.checked,
                        },
                        ...prev.variables.slice(index + 1),
                      ],
                    }));
                  }}
                >
                  Default Select First?
                </Checkbox>
              )}
            </div>
          </div>
        );
      case "hardcoded":
        return (
          <div style={{ gap: "10px" }}>
            <Button
              type="dashed"
              onClick={() => addOption(index)}
              size="small"
              icon={<FaPlus />}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "5px",
                marginBottom: "10px",
              }}
            >
              Add Option
            </Button>
            <div
              style={{ display: "flex", flexDirection: "column", gap: "10px" }}
            >
              {variable?.options.length > 0 && (
                <div
                  style={{ display: "flex", alignItems: "center", gap: "10px" }}
                >
                  <Table
                    columns={[
                      {
                        title: "Label",
                        dataIndex: "label",
                        key: "label",
                        render: (text, record, i) => (
                          <Input
                            value={record?.label}
                            onChange={(e) => {
                              const updatedOptions = [...variable?.options];
                              updatedOptions[i] = {
                                ...updatedOptions[i],
                                label: e?.target?.value,
                              };
                              setQueryDetails((prev) => ({
                                ...prev,
                                variables: [
                                  ...prev.variables.slice(0, index),
                                  {
                                    ...prev.variables[index],
                                    options: updatedOptions,
                                  },
                                  ...prev.variables.slice(index + 1),
                                ],
                              }));
                            }}
                            style={{ width: "100%" }}
                            placeholder="Label"
                            size="small"
                          />
                        ),
                      },
                      {
                        title: "Value",
                        dataIndex: "value",
                        key: "value",
                        render: (text, record, i) => (
                          <Input
                            value={record?.value}
                            onChange={(e) => {
                              const updatedOptions = [...variable?.options];
                              updatedOptions[i] = {
                                ...updatedOptions[i],
                                value: e?.target?.value,
                              };
                              setQueryDetails((prev) => ({
                                ...prev,
                                variables: [
                                  ...prev.variables.slice(0, index),
                                  {
                                    ...prev.variables[index],
                                    options: updatedOptions,
                                  },
                                  ...prev.variables.slice(index + 1),
                                ],
                              }));
                            }}
                            style={{ width: "100%" }}
                            placeholder="Value"
                            size="small"
                          />
                        ),
                      },
                      {
                        title: "Default Selected?",
                        dataIndex: "default_selected",
                        key: "default_selected",
                        render: (text, record, i) => (
                          <Checkbox
                            style={{
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                            }}
                            checked={
                              variable?.type === "select"
                                ? record?.value !== ""
                                  ? variable?.defaultValue === record?.value
                                  : false
                                : variable?.defaultValue.includes(record?.value)
                            }
                            onChange={(e) => {
                              if (record?.value === "") {
                                return;
                              }
                              if (variable?.type === "multi-select") {
                                setQueryDetails((prev) => ({
                                  ...prev,
                                  variables: [
                                    ...prev.variables.slice(0, index),
                                    {
                                      ...prev.variables[index],
                                      defaultValue: e.target.checked
                                        ? [
                                            ...queryDetails?.variables[index]
                                              ?.defaultValue,
                                            record?.value,
                                          ]
                                        : queryDetails?.variables[
                                            index
                                          ]?.defaultValue.filter(
                                            (x) => x !== record?.value
                                          ),
                                    },

                                    ...prev.variables.slice(index + 1),
                                  ],
                                }));
                              } else {
                                setQueryDetails((prev) => ({
                                  ...prev,
                                  variables: [
                                    ...prev.variables.slice(0, index),
                                    {
                                      ...prev.variables[index],
                                      defaultValue: e.target.checked
                                        ? record?.value
                                        : "",
                                    },
                                    ...prev.variables.slice(index + 1),
                                  ],
                                }));
                              }
                            }}
                          />
                        ),
                      },
                      {
                        // title: "Action",
                        dataIndex: "action",
                        key: "action",
                        render: (text, record, i) => (
                          <Button
                            size="small"
                            type="dashed"
                            danger
                            title="Delete Option"
                            onClick={() => deleteOption(index, i)}
                            icon={<FaTrash />}
                          />
                        ),
                      },
                    ]}
                    dataSource={variable?.options}
                  />
                </div>
              )}
            </div>
          </div>
        );
    }
  }
  function renderVariableByType(variable, index) {
    switch (variable?.type) {
      case "select":
      case "multi-select":
        return (
          <div
            style={{ display: "flex", flexDirection: "column", gap: "10px" }}
          >
            <InputWithLabel label="Options Type">
              <Select
                placeholder="type"
                options={[
                  { label: "api", value: "api" },
                  { label: "hardcoded", value: "hardcoded" },
                ]}
                value={variable?.optionsType}
                onChange={(value) =>
                  setQueryDetails((prev) => ({
                    ...prev,
                    variables: [
                      ...prev.variables.slice(0, index),
                      {
                        ...prev.variables[index],
                        optionsType: value,
                        defaultSelectFirst: false,
                        defaultValue: "",
                        options:
                          value === "api"
                            ? {
                                url: "",
                                type: "",

                                params: {},
                                map: {
                                  label: "",
                                  value: "",
                                },
                              }
                            : [],
                      },
                      ...prev.variables.slice(index + 1),
                    ],
                  }))
                }
                style={{ width: "100px" }}
              />
            </InputWithLabel>
            {renderSelectTypeOptions(variable, index)}
          </div>
        );
      case "date-time":
        return (
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <Checkbox
              checked={variable?.showTime}
              onChange={(e) =>
                setQueryDetails((prev) => ({
                  ...prev,
                  variables: [
                    ...prev.variables.slice(0, index),
                    {
                      ...prev.variables[index],
                      showTime: e?.target?.checked,
                      format: e?.target?.checked
                        ? "YYYY-MM-DD HH:mm:ss"
                        : "YYYY-MM-DD",
                    },
                    ...prev.variables.slice(index + 1),
                  ],
                }))
              }
            >
              Show Time
            </Checkbox>
          </div>
        );
      case "hardcoded":
        return (
          <InputWithLabel label="Default Value" reqMark={true}>
            <Input
              value={variable?.defaultValue}
              onChange={(e) =>
                setQueryDetails((prev) => ({
                  ...prev,
                  variables: [
                    ...prev.variables.slice(0, index),
                    {
                      ...prev.variables[index],
                      defaultValue: e?.target?.value,
                    },
                    ...prev.variables.slice(index + 1),
                  ],
                }))
              }
              style={{ width: 100 }}
            />
          </InputWithLabel>
        );
    }
  }
  function escapeRegExp(string) {
    return string.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"); // $& means the whole matched string
  }
  function addVariable() {
    setQueryDetails((prev) => ({
      ...prev,
      variables: [
        ...prev.variables,
        {
          name: "",
          type: "",
          optionsType: "",
          options: [],
        },
      ],
    }));
  }
  function addVariableBelow(index) {
    setQueryDetails((prev) => ({
      ...prev,
      variables: [
        ...prev.variables.slice(0, index + 1),
        {
          name: "",
          type: "",
          optionsType: "",
          options: [],
        },
        ...prev.variables.slice(index + 1),
      ],
    }));
  }
  function shiftVariableUp(index) {
    if (index === 0) {
      return;
    }
    const newArray = [...queryDetails?.variables];
    const temp = newArray[index - 1];
    newArray[index - 1] = newArray[index];
    newArray[index] = temp;
    setQueryDetails((prev) => ({
      ...prev,
      variables: newArray,
    }));
  }

  function shiftVariableDown(index) {
    if (index === queryDetails?.variables?.length - 1) {
      return;
    }
    const newArray = [...queryDetails?.variables];
    const temp = newArray[index + 1];
    newArray[index + 1] = newArray[index];
    newArray[index] = temp;
    setQueryDetails((prev) => ({
      ...prev,
      variables: newArray,
    }));
  }

  return (
    <Tabs
      defaultActiveKey="1"
      type="card"
      tabBarExtraContent={
        <Button
          type="primary"
          onClick={() =>
            saveQueryDetails(!isAddNew ? queryDetails?.query_report_id : null)
          }
          className="actions-button"
        >
          {isAddNew ? "Add Query" : "Update Query"}
        </Button>
      }
    >
      <TabPane tab="Query" key="1">
        <div
          style={{
            gap: "10px",
            overflow: "hidden",
          }}
        >
          <Row gutter={16}>
            <Col span={16} push={8}>
              {!queryDetails?.variables?.length && (
                <Button
                  type="primary"
                  style={{
                    backgroundColor: "#008CBA",
                    color: "white",
                    borderRadius: "5px",
                    border: "none",
                    fontSize: "12px",
                    cursor: "pointer",
                  }}
                  onClick={() => addVariable()}
                >
                  Add Variable
                </Button>
              )}
              <InfiniteScroll
                style={{ height: height - 100, overflow: "auto" }}
                dataLength={queryDetails?.variables?.length}
                scrollableTarget="scrollableDiv"
              >
                {queryDetails?.variables?.map((variable, index) => {
                  return (
                    <Popover
                      placement="right"
                      showArrow={false}
                      // trigger="click"
                      content={
                        <div className="question-popover-container">
                          <FaArrowUp
                            onClick={() => shiftVariableUp(index)}
                            style={{ cursor: "pointer" }}
                            title="Shift Variable Up"
                          />
                          <FaArrowDown
                            onClick={() => shiftVariableDown(index)}
                            style={{ cursor: "pointer" }}
                            title="Shift Variable Down"
                          />
                          <Popconfirm
                            title="Are you sure?"
                            onConfirm={() => deleteVariable(index)}
                            okText="Yes"
                            cancelText="No"
                          >
                            <FaTrash
                              style={{ cursor: "pointer" }}
                              title="Delete Variable"
                            />
                          </Popconfirm>
                          <FaPlus
                            onClick={() => addVariableBelow(index)}
                            style={{ cursor: "pointer" }}
                            title="Add Variable Below"
                          />
                        </div>
                      }
                      style={{ padding: "0px" }}
                    >
                      <Card
                        title={
                          <div
                            style={{
                              display: "inline-flex",
                              alignItems: "center",
                              gap: "10px",
                            }}
                          >
                            <InputWithLabel label="Variable">
                              <Input
                                value={variable?.name}
                                onChange={(e) =>
                                  setQueryDetails((prev) => ({
                                    ...prev,
                                    query: prev.query.replace(
                                      new RegExp(
                                        `{${escapeRegExp(variable?.name)}}`,
                                        "g"
                                      ),
                                      `{${e?.target?.value}}`
                                    ),
                                    variables: [
                                      ...prev.variables.slice(0, index),
                                      {
                                        ...prev.variables[index],
                                        name: e?.target?.value,
                                      },
                                      ...prev.variables.slice(index + 1),
                                    ],
                                  }))
                                }
                                style={{ width: "200px" }}
                              />
                            </InputWithLabel>
                            <InputWithLabel label="Type">
                              <Select
                                placeholder="Type"
                                options={variableTypes.map((x) => {
                                  return {
                                    label: x,
                                    value: x,
                                  };
                                })}
                                value={variable?.type}
                                onChange={(value) =>
                                  setQueryDetails((prev) => ({
                                    ...prev,
                                    variables: [
                                      ...prev.variables.slice(0, index),
                                      {
                                        ...prev.variables[index],
                                        defaultValue:
                                          value === "multi-select" ? [] : "",
                                        name: variable?.name,
                                        type: value,
                                        format:
                                          value === "date-time"
                                            ? "YYYY-MM-DD"
                                            : "",
                                      },
                                      ...prev.variables.slice(index + 1),
                                    ],
                                  }))
                                }
                                style={{ width: "200px" }}
                              />
                            </InputWithLabel>
                            {renderDefaultValue(variable, index)}
                          </div>
                        }
                        key={variable?.key}
                        bordered
                        style={{
                          padding: "10px",
                          boxShadow:
                            "0 5px 10px rgba(0, 0, 0, 0.3), 0 2px 2px rgba(0, 0, 0, 0.2)",
                          borderRadius: "5px",
                          margin: "5px",
                        }}
                        extra={
                          <Button
                            size="small"
                            type="dashed"
                            danger
                            title="Delete Option"
                            onClick={() => deleteVariable(index)}
                            icon={<FaTrash />}
                          />
                        }
                      >
                        <div
                          style={{
                            display: "flex",
                            justifyContent: "space-between",
                            flexDirection: "column",
                            gap: "10px",
                          }}
                        >
                          <div>{renderVariableByType(variable, index)}</div>
                        </div>
                      </Card>
                    </Popover>
                  );
                })}
              </InfiniteScroll>
            </Col>
            <Col span={8} pull={16}>
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "20px",
                  padding: "10px",
                  backgroundColor: "floralwhite",
                }}
              >
                {/* {isAddNew ? (
                            <Divider orientation="left">Add New Query</Divider>
                        ) : (
                            <Divider orientation="left">Edit Query</Divider>
                        )} */}
                <div
                  style={{ display: "flex", gap: "10px", alignItems: "center" }}
                >
                  <InputWithLabel label="Name">
                    <Input
                      placeholder="Name"
                      value={queryDetails?.name}
                      onChange={(e) =>
                        setQueryDetails((prev) => ({
                          ...prev,
                          name: e?.target?.value,
                        }))
                      }
                      style={{ width: "200px" }}
                    />
                  </InputWithLabel>
                </div>
                <InputWithLabel label="Description">
                  <Input.TextArea
                    placeholder="Description"
                    value={queryDetails?.description}
                    onChange={(e) =>
                      setQueryDetails((prev) => ({
                        ...prev,
                        description: e?.target?.value,
                      }))
                    }
                    autoSize={{ minRows: 3, maxRows: 6 }}
                  />
                </InputWithLabel>
                <Affix offsetTop={100}>
                  {/* <InputWithLabel label="Query"> */}
                  <div
                    style={{
                      background: "#2b2b2b",
                      borderRadius: "6px",
                      border: "1px solid #444",
                      boxShadow: "0 2px 8px rgba(0,0,0,0.12)",
                      padding: "0",
                      position: "relative",
                      width: "100%",
                    }}
                  >
                    <div
                      style={{
                        background: "#232323",
                        color: "#b5cea8",
                        fontFamily: "JetBrains Mono, Fira Mono, monospace",
                        fontSize: "13px",
                        padding: "8px 16px",
                        borderBottom: "1px solid #333",
                        borderTopLeftRadius: "6px",
                        borderTopRightRadius: "6px",
                        letterSpacing: "0.5px",
                        userSelect: "none",
                        display: "flex",
                        alignItems: "center",
                        gap: "8px",
                      }}
                    >
                      <span style={{ color: "#50fa7b", fontWeight: 600 }}>
                        SQL Console
                      </span>
                    </div>
                    <Input.TextArea
                      key={queryDetails?.query_report_id}
                      value={queryDetails?.query}
                      onClick={() =>
                        setQueryConsole((prev) => ({
                          ...prev,
                          visible: true,
                          query: queryDetails?.query,
                        }))
                      }
                      style={{
                        background: "#2b2b2b",
                        color: "#b5cea8",
                        fontFamily: "JetBrains Mono, Fira Mono, monospace",
                        fontSize: "14px",
                        border: "none",
                        borderRadius: "0 0 6px 6px",
                        minHeight: `${Math.max(120, height / 2)}px`,
                        outline: "none",
                        resize: "vertical",
                        padding: "16px",
                        boxShadow: "none",
                        lineHeight: 1.6,
                        caretColor: "#ffd700",
                      }}
                      onChange={(e) =>
                        setQueryDetails((prev) => ({
                          ...prev,
                          query: e.target.value,
                        }))
                      }
                      placeholder="Write your SQL query here..."
                      autoSize={false}
                    />
                  </div>
                  {/* </InputWithLabel> */}
                </Affix>

                <div
                  style={{ display: "flex", gap: "10px", alignItems: "center" }}
                >
                  <Button
                    size="small"
                    style={{
                      background: "#313335",
                      color: "#b5cea8",
                      border: "1px solid #444",
                      borderRadius: "3px",
                      fontFamily: "JetBrains Mono, Fira Mono, monospace",
                      fontSize: "12px",
                      boxShadow: "none",
                    }}
                    onClick={() => queryChangeHandler(queryDetails?.query)}
                  >
                    Extract Variables
                  </Button>
                </div>
              </div>
            </Col>
          </Row>

          {/* <Collapse > */}
          {/* <InfiniteScroll
                        style={{ height: `${queryDetails?.variables?.length * 200}px`, maxHeight: "400px" }}
                        dataLength={queryDetails?.variables?.length}
                        scrollableTarget="scrollableDiv"
                    > */}

          {/* </InfiniteScroll> */}
          {/* <QueryModal
                        queryConsole={queryConsole}
                        setQueryConsole={setQueryConsole}
                        queryChangeHandler={queryChangeHandler}
                    /> */}
        </div>
      </TabPane>
      <TabPane tab="Test" key="2">
        <div>
          <MasterReportsTable config={queryDetails} showSearch={false} />
        </div>
      </TabPane>
    </Tabs>
  );
  // [
  //     {
  //       "type": "select",
  //       "name": "client_id",
  //       "defaultValue": 0,
  //       "optionsType": "api",
  //       "defaultSelectFirst": true,
  //       "options": {
  //         "url": "/masters/clients",
  //         "type": "get",
  //         "params": {},
  //         "map": {
  //           "label": "COMPANY_NAME",
  //           "value": "ID"
  //         }
  //       }
  //     },
  //     {
  //       "type": "multi-select",
  //       "name": "form_status",
  //       "defaultValue": ["submitted", "approved", "open", "wip"],
  //       "optionsType": "hardcoded",
  //       "options": [
  //         {
  //           "value": "submitted",
  //           "label": "Submitted"
  //         },
  //         {
  //           "value": "approved",
  //           "label": "Approved"
  //         },
  //         {
  //           "value": "open",
  //           "label": "Open"
  //         },
  //         {
  //           "value": "wip",
  //           "label": "WIP"
  //         }
  //       ]
  //     },
  //     {
  //       "type": "date-time",
  //       "name": "from_date",
  //       "format": "YYYY-MM-DD",
  //       "defaultValue": null,
  //       "showTime": false
  //     },
  //     {
  //       "type": "date-time",
  //       "name": "to_date",
  //       "format": "YYYY-MM-DD",
  //       "defaultValue": null,
  //       "showTime": false
  //     }
  //   ]
}

const QueriesHandler = ({ selected, options, config, setRefetch }) => {
  const [open, setOpen] = React.useState(false);
  const [drawerOpen, setDrawerOpen] = React.useState({
    visible: false,
    record: null,
    type: "",
    isAddNew: false,
  });

  const columns = useMemo(() => {
    return [
      {
        title: "Name",
        dataIndex: "name",
        key: "name",
      },
      {
        title: "Description",
        dataIndex: "description",
        key: "description",
      },
      {
        width: "100px",
        render: (_, record) => (
          <Space>
            <Button
              type="primary"
              className="actions-button"
              onClick={() =>
                setDrawerOpen({
                  visible: true,
                  record: record,
                  type: "Edit",
                  isAddNew: false,
                })
              }
            >
              <CiEdit />
            </Button>
            <Popconfirm
              title="Sure to delete?"
              onConfirm={() => handleDelete(record)}
            >
              <Button danger type="dashed" className="actions-button">
                <FaTrash />
              </Button>
            </Popconfirm>
          </Space>
        ),
      },
    ];
  }, []);
  async function handleDelete(record) {
    await axios({
      url: "/qr/delete-query-report",
      method: "delete",
      params: {
        config_id: record?.query_report_id,
      },
    })
      .then((response) => {
        message.success("Query Report Deleted Successfully");
        setRefetch((prev) => prev + 1);
      })
      .catch((error) => {
        error.handleGlobally("Error while fetching allQueryReports");
        // throw error;
      });
  }
  const { width, height } = useDebounce(useWindowSize(), 1000);
  return (
    <div>
      <Button
        type="primary"
        className="actions-button"
        onClick={() => {
          setOpen(true);
        }}
      >
        <CiSettings /> Manage
      </Button>
      <Modal
        open={open}
        onCancel={() => setOpen(false)}
        title="Queries"
        footer={null}
        width={1000}
      >
        <div style={{ display: "flex", justifyContent: "space-between" }}>
          <span></span>
          <Button
            type="primary"
            onClick={() =>
              setDrawerOpen({
                visible: true,
                type: "Add",
                record: null,
                isAddNew: true,
              })
            }
          >
            Add New
          </Button>
        </div>
        <Table
          columns={columns}
          dataSource={options}
          size="small"
          pagination={{
            position: ["bottomRight"],
            showSizeChanger: true,
            pageSizeOptions: ["10", "20", "50", "100", "200", "500", "1000"],
            defaultPageSize: 10,
          }}
          rowKey={(record) => record?.query_report_id}
          // onexpand call the useConfigById and pass the query_report_id and render its contents
          // expandable={{
          //     expandedRowRender: (record) => {
          //         return (
          //             <div>
          //                 <RenderVariables record={record} options={options} setRefetch={setRefetch} />
          //             </div>
          //         );
          //     },
          // }}
        />
        {/* <RenderVariables isAddNew={true} options={options} setRefetch={setRefetch} /> */}
        <Drawer
          // title={`${drawerOpen?.type} Query`}
          placement="right"
          width={width * (9 / 10)}
          closable={false}
          onClose={() =>
            setDrawerOpen({
              visible: false,
              record: null,
              type: "",
              isAddNew: false,
            })
          }
          open={drawerOpen.visible}
          key="right"
        >
          <RenderVariables
            onClose={() =>
              setDrawerOpen({
                visible: false,
                record: null,
                type: "",
                isAddNew: false,
              })
            }
            height={height}
            width={width}
            open={drawerOpen?.visible}
            record={drawerOpen?.record}
            options={options}
            setRefetch={setRefetch}
            isAddNew={drawerOpen?.isAddNew}
          />
        </Drawer>
        {/* <Collapse > */}
        {/* </Collapse> */}
      </Modal>
    </div>
  );
};

const QueryModal = ({ queryConsole, setQueryConsole, queryChangeHandler }) => {
  const ref = React.useRef(null);

  React.useEffect(() => {
    if (queryConsole.visible && ref.current) {
      ref.current.focus();
    }
  }, [queryConsole.visible]);
  return (
    <Modal
      open={queryConsole?.visible}
      onCancel={() => {
        setQueryConsole((prev) => ({ ...prev, visible: false }));
      }}
      title="Query Console"
      width={1000}
      maskClosable={false}
      okText="Done"
      onOk={() => {
        setQueryConsole((prev) => ({ ...prev, visible: false }));
        queryChangeHandler(queryConsole?.query);
      }}
    >
      <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
        <Input.TextArea
          ref={ref}
          value={queryConsole?.query}
          style={{
            whiteSpace: "pre-wrap",
            background: "black",
            color: "#fff",
            borderRadius: "5px",
          }}
          onChange={(e) =>
            setQueryConsole((prev) => ({ ...prev, query: e?.target?.value }))
          }
          placeholder="Start writing your query here..."
          autoSize={{ minRows: 6, maxRows: 12 }}
        />
      </div>
    </Modal>
  );
};

const DebugModal = ({ selected, options, config }) => {
  const [open, setOpen] = React.useState(false);
  const finalSqlQuery = React.useMemo(() => {
    let finalSqlQuery = config?.query;
    for (let key in selected) {
      let value = selected[key];
      if (Array.isArray(value)) {
        value = `(${value?.join(",")})`;
      }
      finalSqlQuery = finalSqlQuery.replace(`{${key}}`, value);
    }
    return finalSqlQuery;
  }, [config?.query, selected]);

  return (
    <div>
      <Button type="dashed" onClick={() => setOpen(true)}>
        <FaBug />
      </Button>
      <Modal
        open={open}
        onCancel={() => setOpen(false)}
        title="Debug"
        footer={null}
        width={1000}
      >
        <Tabs
          defaultActiveKey="1"
          // onChange={callback}
          // tabBarExtraContent={<Button onClick={() => setOpen(false)}>Close</Button>}
          items={[
            {
              label: "Selected",
              key: "1",
              children: <ReactJson src={selected} theme="colors" />,
            },
            {
              label: "Options",
              key: "2",
              children: <ReactJson src={options} theme="colors" />,
            },
            {
              label: "Config",
              key: "3",
              children: <ReactJson src={config} theme="colors" />,
            },
            {
              label: "Final SQL Query",
              key: "4",
              children: (
                <div
                  style={{
                    whiteSpace: "pre-wrap",
                    background: "black",
                    color: "#fff",
                    padding: "3px",
                  }}
                >
                  {finalSqlQuery}
                </div>
              ),
            },
          ]}
        />
      </Modal>
    </div>
  );
};
