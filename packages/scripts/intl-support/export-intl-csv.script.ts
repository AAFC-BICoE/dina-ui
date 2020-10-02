import { MESSAGE_GROUPS } from "./intl-config";
import { messagesToCsv } from "./messages-csv-export";

const csv = messagesToCsv(MESSAGE_GROUPS);

// Output the csv to the stdout:
process.stdout.write(csv);
