import { Route, Routes } from "react-router-dom";
import QueryReportsWrapper from "./QueryReportsWrapper";

function App() {
  return (
    <div className="App">
      <Routes>
        <Route path="/query-reports-demo" element={<QueryReportsWrapper />} />
      </Routes>
    </div>
  );
}

export default App;
