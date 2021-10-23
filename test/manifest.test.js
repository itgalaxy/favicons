import favicons from "../src";
import { logo_png } from "./util";

it("should not prefer any related applications by default", async () => {
  expect.assertions(3);

  const result = await favicons(logo_png, {
    output: { images: false, html: false },
  });
  const manifestFile = result.files.find(
    (file) => file.name === "manifest.json"
  );

  expect(manifestFile).toBeDefined();

  const manifest = JSON.parse(manifestFile.contents);

  expect(manifest).toBeDefined();
  expect(manifest).not.toHaveProperty("prefer_related_applications");
});

it("should list preferrable related applications", async () => {
  expect.assertions(4);

  const relatedApplications = [
    {
      platform: "play",
      url: "https://play.google.com/store/apps/details?id=com.example.app1",
      id: "com.example.app1",
    },
    {
      platform: "itunes",
      url: "https://itunes.apple.com/app/example-app1/id123456789",
    },
  ];
  const result = await favicons(logo_png, {
    preferRelatedApplications: true,
    relatedApplications,
    output: { images: false, html: false },
  });
  const manifestFile = result.files.find(
    (file) => file.name === "manifest.json"
  );

  expect(manifestFile).toBeDefined();

  const manifest = JSON.parse(manifestFile.contents);

  expect(manifest).toBeDefined();
  expect(manifest).toHaveProperty("prefer_related_applications");
  expect(manifest.related_applications).toStrictEqual(relatedApplications);
});
