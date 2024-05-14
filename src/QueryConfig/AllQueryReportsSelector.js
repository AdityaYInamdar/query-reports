import React, { useEffect, useState } from "react";
import {
    Select,
    message
} from "antd";
import axios from "axios";
import { InputWithLabel } from "../Components/Components";
import { QueriesHandler } from "./QueriesHandler";
import { CreateReportFromConfig } from "./CreateReportFromConfig";
import MyPortal from "../Components/MyPortal";

export function AllQueryReportsSelector({ allQuerysUrl, style, id, onDelete=()=>{}, singleRowUrl="/query-reports/get-config-by-id", reportsPassword = 'hi' }) {
    const [selectedReport, setSelectedReport] = React.useState(null);
    const [allQueryReports, setAllQueryReports] = useState(null);
    const [allQueryReportsLoading, setAllQueryReportsLoading] = useState(false);
    const [refetch, setRefetch] = React.useState(0);
    useEffect(() => {
        const fetchData = async () => {
            setAllQueryReportsLoading(true);
            try {
                const response = await axios.get(`${allQuerysUrl}`);
                let data = response?.data?.data?.map((item) => {
                    return {
                        ...item,
                        label: item?.name,
                        value: item?.query_report_id,
                    };
                });
                setSelectedReport(data[0]?.value);
                setAllQueryReports(data);
            } catch (error) {
                message.error("Error while fetching allQueryReports");
            } finally {
                setAllQueryReportsLoading(false);
            }
        };

        fetchData();
    }, [refetch]);
    // const { data: allQueryReports, isLoading: allQueryReportsLoading } = useQuery({
    //     queryKey: ["allQueryReports", refetch],
    //     queryFn: async () => {
    //         const response = await axios({
    //             url: "/query-reports/get-all-query-reports",
    //             method: "get",
    //         })
    //             .then((response) => {
    //                 return response;
    //             })
    //             .catch((error) => {
    //                 message.error("Error while fetching allQueryReports");
    //                 throw error;
    //             });
    //         let data = response?.data?.data?.map((item) => {
    //             return {
    //                 ...item,
    //                 label: item?.name,
    //                 value: item?.query_report_id,
    //             };
    //         });
    //         setSelectedReport(data[0]?.value);
    //         return data;
    //     },
    // });

    return allQueryReportsLoading ? (
        <div>Loading...</div>
    ) : (
        <>
            <MyPortal id={id}>
                <div style={{ display: "inline-flex", ...style }}>
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
                    <QueriesHandler options={allQueryReports} setRefetch={setRefetch} onDelete={onDelete} reportsPassword={reportsPassword}/>
                </div>
            </MyPortal>
            {selectedReport && <CreateReportFromConfig configId={selectedReport} singleRowUrl={singleRowUrl}/>}
        </>
    );
}