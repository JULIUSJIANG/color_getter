import 'antd/dist/antd.css';
import './index.css';

import React from 'react';
import ReactDOM from 'react-dom';

import reportWebVitals from './reportWebVitals';
import RootComponet from './scripts/RootComponent';

import { Provider } from 'react-redux';
import { createStore, Action } from 'redux';
import rootAction from './scripts/RootAction';
import RootState from './scripts/RootState';

const store = createStore<RootState, Action<any>, unknown, unknown>((state, actionType) => {
  switch (actionType.type) {
    case rootAction.TYPE_RELOAD_WEBGL: {
      return {
        ...state,
        shouldCanvasUpdate: true
      }
    };
  }
});

ReactDOM.render(
  <Provider store={ store }>
    <RootComponet/>
  </Provider>,
  document.getElementById('root')
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
