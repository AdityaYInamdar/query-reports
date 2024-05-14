import React, { useEffect, useMemo, useState } from "react";
import ReactJson from "react-json-view";
import {
    Input,
    Table,
    Button,
    message,
    Modal,
    Popconfirm,
    Space,
    Drawer,
} from "antd";
import axios from "axios";
import { CiEdit, CiSettings } from "react-icons/ci";
import { FaTrash} from "react-icons/fa";
import '../Styles/AllStyles.css';
import { useWindowSize } from "../Components/useWindowResize";
import useDebounce from "../Components/useDebounce";
import { RenderVariables } from "./RenderVariables";

export const QueriesHandler = ({ selected, options, config, setRefetch, onDelete = () => {}, reportsPassword }) => {
    const [open, setOpen] = React.useState(false);
    const [drawerOpen, setDrawerOpen] = React.useState({
        visible: false,
        record: null,
        type: "",
        isAddNew: false,
    });
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
                        <Popconfirm title="Sure to delete?" onConfirm={() => onDelete(record)}>
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
            url: "/query-reports/delete-query-report",
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
                message.error("Error while fetching allQueryReports");
                throw error;
            });
    }
    const { width, height } = useDebounce(useWindowSize(), 1000);
    const [password, setPassword] = React.useState({
        password: "",
        visible: false,
    });
    const passwordRef = React.useRef(null);
    return (
        <div>
            <Button
                type="primary"
                className="actions-button"
                // style={{ marginBottom: "13px" }}
                onClick={() => {
                    setPassword((prev) => ({
                        ...prev,
                        visible: true,
                    }));
                    setTimeout(() => {
                        passwordRef.current && passwordRef.current.focus();
                    }, 100);
                }}
            >
                <CiSettings /> Manage
            </Button>
            <Modal
                width={300}
                open={password.visible}
                onCancel={() =>
                    setPassword((prev) => ({
                        ...prev,
                        visible: false,
                    }))
                }
                title="Password"
                footer={null}
            >
                <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                    <Input.Password
                        ref={passwordRef}
                        onPressEnter={() => {
                            if (password.password === reportsPassword) {
                                setPassword((prev) => ({
                                    ...prev,
                                    visible: false,
                                }));
                                setOpen(true);
                            } else {
                                message.error("Invalid Password");
                            }
                        }}
                        value={password.password}
                        onChange={(e) =>
                            setPassword((prev) => ({
                                ...prev,
                                password: e?.target?.value,
                            }))
                        }
                        placeholder="input password"
                    />
                </div>
            </Modal>
            <Modal open={open} onCancel={() => setOpen(false)} title="Queries" footer={null} width={1000}>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <span></span>
                    <Button
                        type="primary"
                        onClick={() => setDrawerOpen({ visible: true, type: "Add", record: null, isAddNew: true })}
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
                        report_id={drawerOpen?.record?.query_report_id}
                        isAddNew={drawerOpen?.isAddNew}
                        queryDetails={queryDetails}
                        setQueryDetails={setQueryDetails}
                    />
                </Drawer>
                {/* <Collapse > */}
                {/* </Collapse> */}
            </Modal>
        </div>
    );
};
