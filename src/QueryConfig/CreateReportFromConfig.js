import { useConfigById } from "../Functions/useConfigById";
import MasterReportsTable from "./MasterReportsTable";

export function CreateReportFromConfig({ configId, singleRowUrl }) {
    const { data: config, isLoading: configLoading, error } = useConfigById({configId : configId, singleRowUrl});
    return configLoading ? (
        <div>Loading...</div>
    ) : error ? (
        <div>Error</div>
    ) : (
        <MasterReportsTable config={config} configId={configId} />
    );
}
