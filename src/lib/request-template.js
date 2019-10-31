/*
 * Returns inerator the will yield requests
 *
 * @example
 * <code>
 * const requestTemplate = {
 *   template: {
 *     verb: 'POST',
 *     url: 'https://jsonplaceholder.typicode.com/users/{userId}',
 *   },
 *   targets: [{
 *     params: { userId: 1 },
 *     // query: { foo: bar },
 *     // body: {},
 *   }, {
 *     params: { userId: 2 },
 *   }, {
 *     params: { userId: 3 },
 *   }],
 *   common: {
 *     body: {
 *       age: 30,
 *     },
 *   },
 * };
 * </code>
 */

function* getRequestInerator(reqTemplate) {
  const targetCount = reqTemplate.targets.length;
  for (let i = 0; i < targetCount; ++i) {
    const { verb, url, body, headers } = getRequestData(reqTemplate, i);
    yield { verb, url, body, headers };
  }
}

function getRequestData(reqTpl, targetIdx = 0) {
  // todo: error handling
  const defaults = { params: {}, query: null, body: null };
  const verb = reqTpl.template.verb || 'GET';
  const urlTpl = reqTpl.template.url;
  // todo: add index check
  const targetData = reqTpl.targets[targetIdx];
  const commonData = reqTpl.common;
  const { params, query, body } = { ...defaults, ...commonData, ...targetData };
  // todo: ability to merge body
  // todo: support headers, with ability to merge
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
