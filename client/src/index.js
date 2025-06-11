import React from "react";
import ReactDOM from "react-dom/client";
import "./App.css";
import App from "./App";
import reportWebVitals from "./reportWebVitals";
import axios from "axios";
import combinedReducer from "./Redux/Reducers/CombinedReducer";
import { Provider } from "react-redux";
import { configureStore } from "@reduxjs/toolkit";
import { BrowserRouter } from "react-router-dom";
import { message } from "antd";
import * as serviceWorkerRegistration from "./serviceWorkerRegistration";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

import AOS from "aos";
import "aos/dist/aos.css";
AOS.init();

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
      refetchOnWindowFocus: true,
      // refetchOnReconnect: false,
    },
  },
});

const store = configureStore({
  reducer: combinedReducer,
});

axios.defaults.baseURL = "http://localhost:8181";

const errorComposer = (error, prefixMessage) => {
  const statusCode = error.response ? error.response.status : null;
  const m = error.response ? error.response.data.detail : null;
  const errorMessage = m ? m : error.message;

  if (statusCode === 401) {
    message.error(prefixMessage + " : Unauthorized");
    localStorage.removeItem("JWT_TOKEN");
    window.location.href = "/login";
  }

  if (!statusCode) {
    message.error(prefixMessage + " : Network Error");
    return;
  } else if (statusCode === 422) {
    message.error(prefixMessage + " : Error with Pydantic Schema");
  } else if (errorMessage) {
    message.error(prefixMessage + " : " + errorMessage);
  } else if (statusCode === 404) {
    message.error(prefixMessage + " : Not Found");
  } else {
    message.error(prefixMessage + " : Error Occured");
  }
};

// apiName comes as a when handling error globally
axios.interceptors.response.use(undefined, (error) => {
  console.log(error);
  error.handleGlobally = (prefixMessage) => {
    console.log("ERROR " + prefixMessage, error);
    errorComposer(error, prefixMessage);
  };

  return Promise.reject(error);
});

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(
  // <React.StrictMode>
  <Provider store={store}>
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </QueryClientProvider>
  </Provider>
  // </React.StrictMode>
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();

// If you want your app to work offline and load faster, you can change
// unregister() to register() below. Note this comes with some pitfalls.
// Learn more about service workers: https://cra.link/PWA
serviceWorkerRegistration.register();
