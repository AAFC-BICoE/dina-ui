// kitsu-core v7.0.4
// https://github.com/wopian/kitsu
// Dist file copied into our source code because next.js does not transpile ES6+ dependencies in node_modules.

"use strict";

async function deattribute(data) {
  return (
    "object" === typeof data &&
      null !== data &&
      (Array.isArray(data)
        ? await data.map(async el => deattribute(el))
        : data.attributes &&
          data.attributes.constructor === Object &&
          (Object.keys(data.attributes).forEach(key => {
            data[key] = data.attributes[key];
          }),
          delete data.attributes)),
    data
  );
}

function error(E) {
  if (E.response) {
    const e = E.response.data;
    e && e.errors && (E.errors = e.errors);
  }

  throw E;
}

async function filterIncludes(included, _ref) {
  let { id, type } = _ref;

  try {
    const filtered = included.filter(
      el => el.id === id && el.type === type
    )[0] || {
      id,
      type
    };
    return Object.assign({}, filtered);
  } catch (E) {
    error(E);
  }
}

async function link(_ref, included) {
  let { id, type, meta } = _ref;
  const filtered = await filterIncludes(included, {
    id,
    type
  });
  return (
    filtered.relationships && (await linkRelationships(filtered, included)),
    meta && (filtered.meta = meta),
    deattribute(filtered)
  );
}

async function linkArray(data, included, key) {
  data[key] = [];

  for (let resource of await data.relationships[key].data)
    data[key].push(await link(resource, included));
}

async function linkObject(data, included, key) {
  (data[key] = await link(data.relationships[key].data, included)),
    delete data[key].relationships;
}

async function linkRelationships(data, included) {
  const { relationships } = data;
  let removeRelationships = !1;

  for (let key in await relationships)
    relationships[key].data && Array.isArray(relationships[key].data)
      ? (await linkArray(data, included, key), (removeRelationships = !0))
      : relationships[key].data &&
        (await linkObject(data, included, key), (removeRelationships = !0));

  return removeRelationships && delete data.relationships, data;
}

async function deserialiseArray(obj) {
  for (let value of await obj.data)
    obj.included && (value = await linkRelationships(value, obj.included)),
      value.attributes && (value = await deattribute(value)),
      (obj.data[obj.data.indexOf(value)] = value);

  return obj;
}

async function deserialise(obj) {
  return (
    obj.data && obj.data.constructor === Array
      ? (obj = await deserialiseArray(obj))
      : obj.included &&
        (obj.data = await linkRelationships(obj.data, obj.included)),
    delete obj.included,
    obj.data && obj.data.attributes && (obj.data = await deattribute(obj.data)),
    obj
  );
}

function queryFormat(value, key) {
  return null !== value && "object" === typeof value
    ? query(value, key)
    : encodeURIComponent(key) + "=" + encodeURIComponent(value);
}

function query(params) {
  let prefix =
    1 < arguments.length && void 0 !== arguments[1] ? arguments[1] : null;
  const str = [];

  for (const param in params)
    params.hasOwnProperty(param) &&
      str.push(
        queryFormat(
          params[param],
          prefix ? "".concat(prefix, "[").concat(param, "]") : param
        )
      );

  return str.join("&");
}

const requiresID = (method, key) =>
  "".concat(method, " requires an ID for the ").concat(key, " relationships");

async function isValid(obj, method, type) {
  if (obj.constructor !== Object || 0 === Object.keys(obj).length)
    throw new Error("".concat(method, " requires a JSON object body"));
  if ("POST" !== method && !obj.id)
    throw new Error(
      "".concat(method, " requires an ID for the ").concat(type, " type")
    );
}

async function serialiseObject(node, nodeType, key, data, method) {
  if ("string" !== typeof node.id) throw new Error(requiresID(method, key));
  return (
    data.relationships || (data.relationships = {}),
    node.type || (node.type = nodeType),
    (data.relationships[key] = {
      data: Object.assign(node)
    }),
    data
  );
}

async function serialiseArray(node, nodeType, key, data, method) {
  return (
    data.relationships || (data.relationships = {}),
    (data.relationships[key] = {
      data: node.map(_ref => {
        let { id, type } = _ref;
        if (!id) throw new Error(requiresID(method, key));
        return {
          id,
          type: type || nodeType
        };
      })
    }),
    data
  );
}

async function serialiseAttr(node, key, data) {
  return (
    data.attributes || (data.attributes = {}),
    (data.attributes[key] = node),
    data
  );
}

async function serialise(model) {
  let obj = 1 < arguments.length && void 0 !== arguments[1] ? arguments[1] : {},
    method =
      2 < arguments.length && void 0 !== arguments[2] ? arguments[2] : "POST";

  try {
    const type = this.plural(this.camel(model));
    let data = {
      type
    };

    for (let key in (await isValid(obj, method, type),
    "POST" !== method && (data.id = obj.id + ""),
    obj)) {
      const node = obj[key],
        nodeType = this.plural(this.camel(key));
      null !== node && node.constructor === Object
        ? (data = await serialiseObject(node, nodeType, key, data, method))
        : null !== node && Array.isArray(node)
        ? (data = await serialiseArray(node, nodeType, key, data, method))
        : "id" !== key &&
          "type" !== key &&
          (data = await serialiseAttr(node, key, data));
    }

    return {
      data
    };
  } catch (E) {
    throw error(E);
  }
}

var index = s =>
  s.replace(/[-_][a-z\u00E0-\u00F6\u00F8-\u00FE]/g, match =>
    match.slice(1).toUpperCase()
  );

var index$1 = s =>
  s.charAt(0).toLowerCase() +
  s
    .slice(1)
    .replace(
      /[A-Z\u00C0-\u00D6\u00D8-\u00DE]/g,
      match => "-" + match.toLowerCase()
    );

var index$2 = s =>
  s.charAt(0).toLowerCase() +
  s
    .slice(1)
    .replace(
      /[A-Z\u00C0-\u00D6\u00D8-\u00DE]/g,
      match => "_" + match.toLowerCase()
    );

module.exports.camel = index;
module.exports.deattribute = deattribute;
module.exports.deserialise = deserialise;
module.exports.error = error;
module.exports.filterIncludes = filterIncludes;
module.exports.kebab = index$1;
module.exports.linkRelationships = linkRelationships;
module.exports.query = query;
module.exports.serialise = serialise;
module.exports.snake = index$2;
