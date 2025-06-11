import { Layout } from "antd";
import { QueryReports } from "./QueryReports";
// import OrgSelector from "../Components/OrgSelector";

export default function QueryReportsWrapper({}) {
  return (
    <>
      <Layout>
        <Layout.Header>
          {/* <div className="navbar-component"> */}
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              height: "100%",
              padding: "0 20px",
            }}
            id="navbar-portal-demo"
          ></div>
          {/* </div> */}
        </Layout.Header>
        <Layout.Content className="main-content-div">
          <QueryReports />
        </Layout.Content>
      </Layout>
    </>
  );
}
