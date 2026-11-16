import cp from "child_process";
import fs from "fs";

const main = (): void => {
  const execute = () => {
    const script: string = "npx prisma generate";
    console.log(script);
    cp.execSync(script, { stdio: "inherit" });
  };

  process.chdir(__dirname + "/..");
  execute();

  const directory: string[] = fs
    .readdirSync(__dirname)
    .filter(
      (file) =>
        fs.statSync(`${__dirname}/${file}`).isDirectory() &&
        fs.existsSync(`${__dirname}/${file}/prisma.config.ts`),
    );
  for (const file of directory) {
    process.chdir(`${__dirname}/${file}`);
    execute();
    const verifier: string = `${__dirname}/${file}/index.ts`;
    if (fs.existsSync(verifier)) require(verifier).default();
  }
};
main();
