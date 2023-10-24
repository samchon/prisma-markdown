import cp from "child_process";
import fs from "fs";

const execute = (str: string) => {
    console.log(`${str}\n`);
    cp.execSync(str, { stdio: "inherit" });
};

const main = (): void => {
    process.chdir(__dirname + "/..");
    execute("npx prisma generate");

    const directory: string[] = fs
        .readdirSync(__dirname)
        .filter((file) => file.endsWith(".prisma"));
    for (const file of directory)
        execute(`npx prisma generate --schema test/${file}`);
};
main();
