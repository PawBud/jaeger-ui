// Copyright (c) 2017 Uber Technologies, Inc.
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
// http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

import { handleActions } from 'redux-actions';

import { fetchTrace, searchTraces } from '../actions/jaeger-api';
import { fetchedState } from '../constants';
import transformTraceData from '../model/transform-trace-data';

const initialState = {
  traces: {},
  search: {
    results: [],
  },
};

function fetchTraceStarted(state, { meta }) {
  const { id } = meta;
  const traces = { ...state.traces, [id]: { state: fetchedState.LOADING } };
  return { ...state, traces };
}

function fetchTraceDone(state, { meta, payload }) {
  const { id } = meta;
  const data = transformTraceData(payload.data[0]);
  let trace;
  if (!data) {
    trace = { state: fetchedState.ERROR, error: new Error('Invalid trace data recieved.') };
  } else {
    trace = { data, state: fetchedState.DONE };
  }
  const traces = { ...state.traces, [id]: trace };
  return { ...state, traces };
}

function fetchTraceErred(state, { meta, payload }) {
  const { id } = meta;
  const trace = { error: payload, state: fetchedState.ERROR };
  const traces = { ...state.traces, [id]: trace };
  return { ...state, traces };
}

function fetchSearchStarted(state) {
  const search = {
    results: [],
    state: fetchedState.LOADING,
  };
  return { ...state, search };
}

function searchDone(state, { payload }) {
  const processed = payload.data.map(transformTraceData);
  const resultTraces = {};
  const results = [];
  for (let i = 0; i < processed.length; i++) {
    const data = processed[i];
    const id = data.traceID;
    resultTraces[id] = { data, state: fetchedState.DONE };
    results.push(id);
  }
  const traces = { ...state.traces, ...resultTraces };
  const search = { results, state: fetchedState.DONE };
  return { ...state, search, traces };
}

function searchErred(state, { payload }) {
  const search = { error: payload, results: [], state: fetchedState.ERROR };
  return { ...state, search };
}

export default handleActions(
  {
    [`${fetchTrace}_PENDING`]: fetchTraceStarted,
    [`${fetchTrace}_FULFILLED`]: fetchTraceDone,
    [`${fetchTrace}_REJECTED`]: fetchTraceErred,

    [`${searchTraces}_PENDING`]: fetchSearchStarted,
    [`${searchTraces}_FULFILLED`]: searchDone,
    [`${searchTraces}_REJECTED`]: searchErred,
  },
  initialState
);
