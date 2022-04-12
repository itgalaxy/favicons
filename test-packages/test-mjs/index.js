/* eslint-disable */
import { favicons, config } from "favicons";

const ok = favicons != null && config != null;
process.exit(ok ? 0 : 1);
