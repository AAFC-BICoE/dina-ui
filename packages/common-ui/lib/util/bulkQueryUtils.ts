/**
 * Maximum number of concurrent API requests issued by useBulkQueries.
 * Shared across all bulk-load sites (material samples, metadata, etc.) to
 * keep back-end load consistent.
 */
export const BULK_QUERY_CONCURRENCY = 150;
