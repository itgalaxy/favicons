import { magenta, green, yellow } from "colors";

export type Logger = (context: string, message: string) => void;

export function dummyLog() {
  // do nothing
}

export function prettyLog(context: string, message: string) {
  message = message.replace(/ \d+(x\d+)?/g, (item) => magenta(item));
  message = message.replace(/#([0-9a-f]{3}){1,2}/g, (item) => magenta(item));
  console.log(`${green("[Favicons]")} ${yellow(context)}: ${message}...`);
}

export function logContext(logger: Logger, context: string): Logger {
  return (innerContext: string, message: string) => {
    logger(`${context}:${innerContext}`, message);
  };
}
