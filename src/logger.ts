import chalk from "chalk";

export type Logger = (context: string, message: string) => void;

export function dummyLog() {
  // do nothing
}

export function prettyLog(context: string, message: string) {
  function highlight(item) {
    return chalk.magenta(item);
  }

  message = message.replace(/ \d+(x\d+)?/g, highlight);
  message = message.replace(/#([0-9a-f]{3}){1,2}/g, highlight);

  console.log(
    `${chalk.green("[Favicons]")} ${chalk.yellow(context)}: ${message}`
  );
}

export function logContext(logger: Logger, context: string): Logger {
  return (innerContext: string, message: string) => {
    logger(`${context}:${innerContext}`, message);
  };
}
