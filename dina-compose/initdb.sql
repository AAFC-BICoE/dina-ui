CREATE SCHEMA object_store;
CREATE SCHEMA seqdb;
CREATE SCHEMA keycloak;
CREATE SCHEMA agent;
CREATE SCHEMA userapi;
CREATE SCHEMA collection;

CREATE EXTENSION IF NOT EXISTS postgis CASCADE;
CREATE EXTENSION IF NOT EXISTS postgis_topology CASCADE;
CREATE EXTENSION IF NOT EXISTS postgis_tiger_geocoder CASCADE;
UPDATE pg_extension SET extrelocatable = TRUE WHERE extname = 'postgis';
ALTER EXTENSION postgis SET SCHEMA collection;

set schema 'seqdb';
create extension if not exists "pgcrypto";
