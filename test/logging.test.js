import favicons from "..";
import { logo_png } from "./util";

describe("logging", () => {
  it("should allow enabling verbose output", async () => {
    const logSpy = jest.spyOn(console, "log").mockImplementation(() => {
      /* do nothing */
    });

    await favicons(logo_png, {
      logging: true,
    });

    expect(logSpy).toHaveBeenCalled();

    logSpy.mockRestore();
  });
});
