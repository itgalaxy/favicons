const favicons = require("../src");
const { logo_png } = require("./util");

describe("logging", () => {
  it("should allow enabling verbose output", async () => {
    const logSpy = jest.spyOn(console, "log").mockImplementation(() => {});

    await favicons(logo_png, {
      logging: true,
    });

    expect(logSpy).toHaveBeenCalled();

    logSpy.mockRestore();
  });
});
