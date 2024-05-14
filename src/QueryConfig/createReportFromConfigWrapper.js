import { CreateReportFromConfig } from "./CreateReportFromConfig";

export function CreateReportFromConfigWrapper() {
    const configId = useParams()?.configId;

    return <CreateReportFromConfig configId={configId} />;
}
