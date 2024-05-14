import { message } from "antd";
import axios from "axios";
import { useEffect, useState } from "react";

export function useConfigById({configId = 0, isAddNew = false, singleRowUrl}) {
    const [data, setData] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);
    // const { data, isLoading, error } = useQuery({
    //     queryKey: ["MasterReportsEditor", configId],
    //     queryFn: async () => {
    //         if (isAddNew || configId === 0) {
    //             return {
    //                 name: "",
    //                 description: "",
    //                 query: "",
    //                 variables: [
    //                     {
    //                         name: "",
    //                         type: "",
    //                         defaultValue: "",
    //                         optionsType: "",
    //                         defaultSelectFirst: false,
    //                     },
    //                 ],
    //             };
    //         }
    //         const response = await axios({
    //             url: "/query-reports/get-config-by-id",
    //             method: "get",
    //             params: {
    //                 config_id: configId,
    //             },
    //         })
    //             .then((response) => {
    //                 return response;
    //             })
    //             .catch((error) => {
    //                 message.error("Error while fetching config for MasterReportsEditor");
    //                 throw error;
    //             });
    //         return response?.data?.data;
    //     },
    // });
    useEffect(() => {
        const fetchData = async () => {
            setIsLoading(true);
            try {
                if (isAddNew || configId === 0) {
                    setData({
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
                    });
                } else {
                    const response = await axios.get(`${singleRowUrl}`, {
                        params: {
                            config_id: configId,
                        },
                    });
                    setData(response?.data?.data);
                }
            } catch (error) {
                message.error("Error while fetching config for MasterReportsEditor");
                setError(error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchData();
    }, [configId, isAddNew]);
    return { data, isLoading, error };
}