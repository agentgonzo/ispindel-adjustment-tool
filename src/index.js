import React from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';
import ReactDOM from 'react-dom/client';
import './App.css';
import {RecalibrationPage} from "./components/RecalibrationPage";

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
      <div>
        <div className="App">
          <RecalibrationPage />
        </div>
      </div>
  </React.StrictMode>
);
