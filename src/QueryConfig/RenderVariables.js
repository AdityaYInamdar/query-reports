import React, { useEffect } from "react";
import {
  Input,
  Table,
  Select,
  InputNumber,
  Button,
  message,
  Tabs,
  Checkbox,
  Card,
  Popconfirm,
  Popover,
  Row,
  Col,
  Radio,
} from "antd";
import axios from "axios";
import { FaPlus, FaTrash, FaArrowUp, FaArrowDown } from "react-icons/fa";
import TabPane from "antd/lib/tabs/TabPane";
import '../Styles/AllStyles.css';
import InfiniteScroll from "react-infinite-scroll-component";
import { InputWithLabel } from "../Components/Components";
import { useConfigById } from "../Functions/useConfigById";
import MasterReportsTable from "./MasterReportsTable";
import useDebounce from "../Components/useDebounce";
import { useWindowSize } from "../Components/useWindowResize";

export function RenderVariables({
  queryDetails,
  //  = {
  //   query: "",
  //   name: "",
  //   description: "",
  //   variables: [
  //     {
  //       name: "",
  //       type: "",
  //       defaultValue: "",
  //       optionsType: "",
  //       defaultSelectFirst: false,
  //     },
  //   ],
  // }
  setQueryDetails,
  report_id,
  singleRowUrl,
  isAddNew = false,
  onSave = () => {},
}) {
  const {
    data: config,
    isLoading: configLoading,
    error,
  } = useConfigById({report_id, isAddNew, singleRowUrl});
  const { width, height } = useDebounce(useWindowSize(), 1000);
  const [optionType, setOptionType] = React.useState("select");
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

  //   async function saveQueryDetails(id) {
  //     // if (!queryDetails?.query.replace(/\s/g, "")?.toLowerCase()?.startsWith("select")) {
  //     //     message.error("Query should start with SELECT");
  //     //     return;
  //     // }
  //     const containsRestrictedKeyword = restrictedKeywords.some((keyword) =>
  //       queryDetails?.query?.toUpperCase().split(" ").includes(keyword)
  //     );
  //     if (containsRestrictedKeyword) {
  //       message.error(`Query contains restricted keywords`);
  //       return;
  //     }
  //     if (isAddNew) {
  //       axios({
  //         url: "/query-reports/add-query-report",
  //         method: "post",
  //         data: {
  //           ...queryDetails,
  //         },
  //       })
  //         .then((response) => {
  //           message.success("Query added successfully");
  //           setRefetch((prev) => prev + 1);
  //         })
  //         .catch((error) => {
  //           message.error("Error while adding query");
  //           throw error;
  //         });
  //     } else {
  //       axios({
  //         url: "/query-reports/update-query-report",
  //         method: "post",
  //         params: {
  //           config_id: id,
  //         },
  //         data: {
  //           ...queryDetails,
  //         },
  //       })
  //         .then((response) => {
  //           message.success("Query updated successfully");
  //           setRefetch((prev) => prev + 1);
  //         })
  //         .catch((error) => {
  //           message.error("Error while updating query");
  //           throw error;
  //         });
  //     }
  //   }
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
                              value: 1,
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
                      message.error(
                        "Error while fetching options for " + variable?.name
                      );
                      throw error;
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
              {optionType === "select" && (
                <>
                  <span
                    style={{ display: "inline-flex", alignItems: "center" }}
                  >
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
                  <span
                    style={{ display: "inline-flex", alignItems: "center" }}
                  >
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
                </>
              )}
              {optionType === "manual" && (
                <>
                  <span
                    style={{ display: "inline-flex", alignItems: "center" }}
                  >
                    <b style={{ marginRight: "10px" }}>Label</b>
                    <Input
                      value={variable?.options?.map?.label}
                      onChange={(e) =>
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
                                  label: e?.target?.value,
                                },
                              },
                            },
                            ...prev.variables.slice(index + 1),
                          ],
                        }))
                      }
                      style={{ width: 200 }}
                      placeholder="Label"
                      size="small"
                    />
                  </span>
                  <span
                    style={{ display: "inline-flex", alignItems: "center" }}
                  >
                    <b style={{ marginRight: "10px" }}>Value</b>
                    <Input
                      value={variable?.options?.map?.value}
                      onChange={(e) =>
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
                                  value: e?.target?.value,
                                },
                              },
                            },
                            ...prev.variables.slice(index + 1),
                          ],
                        }))
                      }
                      style={{ width: 200 }}
                      placeholder="Value"
                      size="small"
                    />
                  </span>
                </>
              )}

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
            <Radio.Group
              value={optionType}
              onChange={(e) => {
                setOptionType(e.target.value);
              }}
            >
              <Radio value="select">Select Options</Radio>
              <Radio value="manual">Manual Options</Radio>
            </Radio.Group>
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
            onSave(!isAddNew ? queryDetails?.query_report_id : null)
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
                {/* <Affix offsetTop={100}> */}
                <InputWithLabel label="Query">
                  <Input.TextArea
                    key={queryDetails?.query_report_id}
                    value={queryDetails?.query}
                    style={{
                      whiteSpace: "pre-wrap",
                      background: "black",
                      color: "#fff",
                      borderRadius: "5px",
                      height: `${height / 2}px`,
                    }}
                    // onPaste={(e) => queryChangeHandler(e.clipboardData.getData("text"))}
                    onChange={(e) =>
                      setQueryDetails((prev) => ({
                        ...prev,
                        query: e.target.value,
                      }))
                    }
                    placeholder="start writing query"

                    // autoSize={{ minRows: 6, maxRows: 12 }}
                  />
                </InputWithLabel>
                {/* </Affix> */}

                <div
                  style={{ display: "flex", gap: "10px", alignItems: "center" }}
                >
                  <Button
                    style={{
                      backgroundColor: "#4CAF50",
                      color: "white",
                      borderRadius: "5px",
                      border: "none",
                      fontSize: "12px",
                      cursor: "pointer",
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
          <MasterReportsTable config={queryDetails} />
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
