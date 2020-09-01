CREATE SCHEMA seqdb;
CREATE SCHEMA keycloak;

set schema 'seqdb';
create extension if not exists "uuid-ossp";
