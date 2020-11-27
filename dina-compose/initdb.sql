CREATE SCHEMA object_store;
CREATE SCHEMA seqdb;
CREATE SCHEMA keycloak;
CREATE SCHEMA agent;
CREATE SCHEMA userapi;

set schema 'seqdb';
create extension if not exists "pgcrypto";
