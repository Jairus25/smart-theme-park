/**
 * Thin wrapper around the official Couchbase Node.js SDK.
 *
 * One Cluster connection is opened at process start and reused for the
 * life of the server (the SDK manages its own connection pool internally --
 * same pattern as the Neo4j driver: do NOT reconnect per request).
 */

"use strict";

const couchbase = require("couchbase");
const path = require("path");
require("dotenv").config();

const CONNECTION_STRING = process.env.CB_CONNECTION_STRING || "couchbases://localhost";
const USERNAME = process.env.CB_USERNAME || "Administrator";
const PASSWORD = process.env.CB_PASSWORD || "password";
const BUCKET_NAME = process.env.CB_BUCKET || "theme_park";
const SCOPE_NAME = process.env.CB_SCOPE || "park";
const TRUST_STORE_PATH = path.join(
  path.dirname(require.resolve("couchbase/package.json")),
  "deps",
  "couchbase-cxx-cache",
  "mozilla-ca-bundle.crt"
);

let cluster = null;
let bucket = null;
let scope = null;

async function getCluster() {
  if (!cluster) {
    cluster = await couchbase.connect(CONNECTION_STRING, {
      username: USERNAME,
      password: PASSWORD,
      // Capella requires TLS (couchbases://); configProfile tunes client
      // timeouts for a WAN connection, which Capella effectively always is.
      configProfile: "wanDevelopment",
      trustStorePath: TRUST_STORE_PATH,
    });
    bucket = cluster.bucket(BUCKET_NAME);
    scope = bucket.scope(SCOPE_NAME);
  }
  return cluster;
}

async function getScope() {
  await getCluster();
  return scope;
}

async function collection(name) {
  const s = await getScope();
  return s.collection(name);
}

/** Run a N1QL query scoped to the park scope (lets you write unqualified
 *  collection names in the query text if you want; here we keep fully
 *  qualified names in the .n1ql files/routes for clarity). */
async function query(statement, options = {}) {
  const c = await getCluster();
  const result = await c.query(statement, options);
  return result.rows;
}

async function ping() {
  const c = await getCluster();
  await c.ping();
}

module.exports = { getCluster, getScope, collection, query, ping, BUCKET_NAME, SCOPE_NAME };
