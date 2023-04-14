import express from "express";
import fs from "fs";
import path from "path";
import zlib from "zlib";
const pkg = JSON.parse(
  (
    await fs.promises.readFile(new URL("package.json", import.meta.url))
  ).toString()
);
const app = express();
import { spawn } from "child_process";
import translate from "./html-to-discord-markdown/index.js";
app.get("/", (req, res) => {
  res.send(
    `<!doctype html><html style="color-scheme:light dark"><meta name="viewport" content="width=device-width, initial-scale=1" />man-api v${pkg.version} - <a href="${pkg.homepage}">Source</a></html>`
  );
});
app.get("/:section/:page", async (req, res) => {
  try {
    if ((req.params.section + req.params.page).match(/[\/\\]/)) {
      res.status(400).end();
      return;
    }
    const manpage = path.join(
      "/usr/share/man/",
      "man" + req.params.section,
      req.params.page + "." + req.params.section + ".gz"
    );
    if (!fs.existsSync(manpage)) {
      res.status(404).send("not found");
      return;
    }
    const pandoc = spawn("pandoc", ["-r", "man", "-t", "html"]);
    fs.createReadStream(manpage).pipe(zlib.createGunzip()).pipe(pandoc.stdin);
    const html = await new Promise((cb, ecb) => {
      let buffer = "";
      let errbuffer = "";
      pandoc.stdout.on("data", (data) => {
        buffer += data.toString();
      });
      pandoc.stderr.on("data", (data) => {
        errbuffer += data.toString();
      });
      pandoc.on("close", (code) => {
        if (code !== 0) {
          ecb(new Error("exit code " + code + "\n" + errbuffer));
        } else {
          cb(buffer);
        }
      });
    });
    const { markdown } = translate(html);
    res.header("Content-Type", "text/plain; charset=utf-8");
    res.write(markdown);
    res.end();
  } catch (e) {
    console.error(e);
    res.status(500).send("error rendering manpage");
  }
});
const listener = app.listen(3014, "127.0.0.1", () => {
  console.log(`Your app is listening on port ${listener.address().port}`);
});
