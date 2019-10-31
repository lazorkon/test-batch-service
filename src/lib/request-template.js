/**
 * @typedef {Object} RequestInfo
 * @property {String} verb, e.g: "GET"|"HEAD"|"POST"|"PUT"|"PATCH"|"DELETE"
 * @property {String} url
 * @property {*} body
 */

/*
 * Returns inerator that will yield requests
 * @yield {RequestInfo}
 */
function* getRequestInerator(reqTemplate) {
  const targetCount = reqTemplate.targets.length;
  for (let i = 0; i < targetCount; ++i) {
    const { verb, url, body } = getRequestData(reqTemplate, i);
    yield { verb, url, body };
  }
}

/**
 * Returns merges request
 * @param {String} reqTpl - request template
 * @param {Number} targetIdx - index of target in reqTpl.targets
 * @returns {RequestInfo}
 */
function getRequestData(reqTpl, targetIdx = 0) {
  // todo: error handling
  const defaults = { params: {}, query: null, body: null };
  const verb = reqTpl.template.verb || 'GET';
  const urlTpl = reqTpl.template.url;
  // todo: add index check
  const targetData = reqTpl.targets[targetIdx];
  const commonData = reqTpl.common;
  const { params, query, body } = { ...defaults, ...commonData, ...targetData };
  // todo: support headers, with validation and ability to merge
  const url = getUrl(urlTpl, { params, query });
  return {
    verb,
    url,
    body,
    headers: null,
  };
}

function getUrl(urlTpl, { params, query }) {
  let url = urlTpl;
  url = addReqUrlParams(url, params);
  url = addReqUrlQuery(url, query)
  return url;
}

function addReqUrlParams(urlTpl, params = {}) {
  // todo: validate if params is object
  return String(urlTpl).replace(/{([\s\S]+?)}/g, (m, v) => {
    if (!params || !params.hasOwnProperty(v)) {
      throw new Error(`Unknown url "${urlTpl}" param "${v}"; params: ${JSON.stringify(params)}`);
    }
    // todo: support formatters (boolean, Date)
    return encodeURIComponent(String(params[v] || ''));
  });
}

function addReqUrlQuery(urlTpl, query = {}) {
  // todo: validate if query is object
  const url = new URL(urlTpl);
  for (const prop of Object.keys(query || {})) {
    url.searchParams.append(prop, query[prop]);
  }
  return url.toString();
}

module.exports = {
  getRequestInerator,
};
