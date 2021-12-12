import 'antd/dist/antd.css';
import './index.css';

import ReactDOM from 'react-dom';

import reportWebVitals from './reportWebVitals';
import RootComponet from './scripts/component/Main';
import { Provider } from 'react-redux';
import root from './scripts/Root';

ReactDOM.render(
  <Provider store={ root.store }>
    <RootComponet/>
  </Provider>,
  document.getElementById('root')
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();