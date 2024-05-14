import React, { useEffect, useMemo, useState } from "react";
import ReactJson from "react-json-view";
import {
    Button,
    Modal,
    Tabs,
} from "antd";
import { FaBug } from "react-icons/fa";

export const DebugModal = ({ selected, options, config }) => {
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
            <Modal open={open} onCancel={() => setOpen(false)} title="Debug" footer={null} width={1000}>
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
                                <div style={{ whiteSpace: "pre-wrap", background: "black", color: "#fff", padding: "3px" }}>
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
