import cp from "child_process";
import fs from "fs";

const execute = (str: string) => {
  console.log(`${str}\n`);
  cp.execSync(str, { stdio: "inherit" });
};

const main = (): void => {
  process.chdir(`${__dirname}/..`);
  execute("npx prisma generate");

  for (const project of fs.readdirSync(`${__dirname}/schemas`)) {
    const location: string = `${__dirname}/schemas/${project}`;
    const stat: fs.Stats = fs.statSync(location);
    if (stat.isDirectory() === false) continue;

    const directory: string[] = fs.readdirSync(location);
    const count: number = directory.filter((f) => f.endsWith(".prisma")).length;
    if (count === 0) continue;
    else if (count === 1)
      execute(
        `npx prisma generate --schema test/schemas/${project}/${project}.prisma`,
      );
    else execute(`npx prisma generate --schema test/schemas/${project}`);
  }
};
main();
