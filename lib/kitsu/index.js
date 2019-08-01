// kitsu v7.0.4
// https://github.com/wopian/kitsu
// Dist file copied into our source code because next.js does not transpile ES6+ dependencies in node_modules.

"use strict";

var axios = require("axios");
var pluralise = require("pluralize");
var kitsuCore = require("../kitsu-core");

class Kitsu {
  constructor() {
    let options =
      0 < arguments.length && void 0 !== arguments[0] ? arguments[0] : {};
    (this.camel = !1 === options.camelCaseTypes ? s => s : kitsuCore.camel),
      (this.resCase =
        "none" === options.resourceCase
          ? s => s
          : "snake" === options.resourceCase
          ? kitsuCore.snake
          : kitsuCore.kebab),
      (this.plural = !1 === options.pluralize ? s => s : pluralise),
      (this.headers = Object.assign({}, options.headers, {
        Accept: "application/vnd.api+json",
        "Content-Type": "application/vnd.api+json"
      })),
      (this.axios = axios.create({
        baseURL: options.baseURL || "https://kitsu.io/api/edge",
        timeout: options.timeout || 30000
      })),
      (this.fetch = this.get),
      (this.update = this.patch),
      (this.create = this.post),
      (this.remove = this.delete);
  }

  async get(model) {
    let params =
        1 < arguments.length && void 0 !== arguments[1] ? arguments[1] : {},
      headers =
        2 < arguments.length && void 0 !== arguments[2] ? arguments[2] : {};

    try {
      let [res, id, relationship] = model.split("/"),
        url = this.plural(this.resCase(res));
      id && (url += "/".concat(id)),
        relationship && (url += "/".concat(this.resCase(relationship)));
      const { data } = await this.axios.get(url, {
        params,
        paramsSerializer: p => kitsuCore.query(p),
        headers: Object.assign(this.headers, headers)
      });
      return kitsuCore.deserialise(data);
    } catch (E) {
      throw kitsuCore.error(E);
    }
  }

  async patch(model, body) {
    let headers =
      2 < arguments.length && void 0 !== arguments[2] ? arguments[2] : {};

    try {
      const serialData = await kitsuCore.serialise.apply(this, [
          model,
          body,
          "PATCH"
        ]),
        url = this.plural(this.resCase(model)) + "/" + body.id,
        { data } = await this.axios.patch(url, serialData, {
          headers: Object.assign(this.headers, headers)
        });
      return data;
    } catch (E) {
      throw kitsuCore.error(E);
    }
  }

  async post(model, body) {
    let headers =
      2 < arguments.length && void 0 !== arguments[2] ? arguments[2] : {};

    try {
      const url = this.plural(this.resCase(model)),
        { data } = await this.axios.post(
          url,
          await kitsuCore.serialise.apply(this, [model, body]),
          {
            headers: Object.assign(this.headers, headers)
          }
        );
      return data;
    } catch (E) {
      throw kitsuCore.error(E);
    }
  }

  async delete(model, id) {
    let headers =
      2 < arguments.length && void 0 !== arguments[2] ? arguments[2] : {};

    try {
      const url = this.plural(this.resCase(model)) + "/" + id,
        { data } = await this.axios.delete(url, {
          data: await kitsuCore.serialise.apply(this, [
            model,
            {
              id
            },
            "DELETE"
          ]),
          headers: Object.assign(this.headers, headers)
        });
      return data;
    } catch (E) {
      throw kitsuCore.error(E);
    }
  }

  async self() {
    let params =
        0 < arguments.length && void 0 !== arguments[0] ? arguments[0] : {},
      headers =
        1 < arguments.length && void 0 !== arguments[1] ? arguments[1] : {};

    try {
      const res = await this.get(
        "users",
        Object.assign(
          {
            filter: {
              self: !0
            }
          },
          params
        ),
        headers
      );
      return res.data[0];
    } catch (E) {
      throw kitsuCore.error(E);
    }
  }
}

module.exports = Kitsu;
