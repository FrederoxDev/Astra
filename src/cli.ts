import { CompilationTarget, compileAddon, compileDirectory, compileFile, CompilerConfig, getFileInfo, PackType, targetToPath } from "./lib.ts";
import { parse } from "https://deno.land/std@0.181.0/flags/mod.ts";
import { dirname, basename } from "https://deno.land/std@0.181.0/path/mod.ts";
import { ensureDirSync } from "https://deno.land/std@0.181.0/fs/mod.ts";

const version = "v1.0.0";

// Get CLI Flags
const flags = parse(Deno.args, {
    boolean: ["version", "v", "preview"],
    alias: {
        v: "version"
    }
});

// Exit if the flag for version was used
if (flags.version) {
    console.log(`Version ${version}`);
    Deno.exit(0);
}

// If there were no flags passed
if (flags._[0] === undefined) {
    console.log("flags: [-v | --version] [--preview]");
    console.log("commands: [watch] [package] [scaffold]")
    Deno.exit(1);
}

const configPath = Deno.cwd() + "\\compiler.config.json";
const configExists = await getFileInfo(configPath) !== undefined;

if (flags._[0] === "scaffold") {
    // Don't create a new project if there is already a project in the CWD
    if (configExists) {
        console.log("compiler.config.json already found")
        Deno.exit(1);
    }

    const packName = prompt("Project Name:");
    if (packName === null) {
        console.log("Invalid Pack Name")
        Deno.exit(1);
    }

    const config: CompilerConfig = {
        packName,
        behaviourPackPath: "\\BP\\",
        resourcePackPath: "\\RP\\"
    }

    Deno.writeTextFileSync(Deno.cwd() + "\\compiler.config.json", JSON.stringify(config, null, 4));
    ensureDirSync(Deno.cwd() + "\\BP\\");
    ensureDirSync(Deno.cwd() + "\\RP\\");

    Deno.writeTextFileSync(Deno.cwd() + "\\.gitignore", "/dist/");

    Deno.run({ cmd: ["git", "init"], stdout: "null" });

    console.log("Initialized Project in directory");
    console.log("Initialized Git Repository");
    Deno.exit(0);
}

if (!configExists) {
    console.log("compiler.config.json not found");
    Deno.exit(1);
}

const packConfig: CompilerConfig = JSON.parse(Deno.readTextFileSync(configPath))

if (flags._[0] === "watch") {
    const target = flags.preview ? CompilationTarget.Preview : CompilationTarget.Stable;
    await compileAddon(packConfig, target);

    console.log("Starting watch mode...")
    // Todo: Watch both RP And BP
    const watcher = Deno.watchFs(Deno.cwd());

    const behaviourPath = Deno.cwd() + "\\BP\\";
    const resourcePath = Deno.cwd() + "\\RP\\";

    for await (const event of watcher) {
        // Ignore non addon stuff;
        if (!event.paths[0].startsWith(behaviourPath) && !event.paths[0].startsWith(resourcePath)) continue;
        
        const packType = event.paths[0].startsWith(behaviourPath) ? PackType.Behaviour : PackType.Resource;
        const relativePath = event.paths[0].replace(packType === PackType.Behaviour ? behaviourPath : resourcePath, "");
        const fileInfo = await getFileInfo(event.paths[0]);
        const destBasePath = targetToPath(target, packType, packConfig.packName);
        const destPath = destBasePath + relativePath

        if (fileInfo === undefined) {
            const destPathExists = await getFileInfo(destPath) !== undefined;
            if (destPathExists) {
                const start = performance.now();
                await Deno.remove(destPath, { recursive: true });
                console.log(`Removed: [${relativePath}] in ${performance.now() - start}ms`)
            }
            
            continue;
        }

        if (fileInfo.isFile) {
            const start = performance.now();
            await compileFile(dirname(event.paths[0]), dirname(destPath), basename(event.paths[0]));
            console.log(`Updated: [${relativePath}] in ${performance.now() - start}ms`)
        }

        if (fileInfo.isDirectory) {
            const start = performance.now();
            const count = await compileDirectory(relativePath, target, packType, packConfig.packName);
            const timeTaken = performance.now() - start;
            console.log(`Compiled ${count} files in ${timeTaken}ms`);
        }
    }

    Deno.exit(0);
}

if (flags._[0] === "package") {
    await compileAddon(packConfig, CompilationTarget.Packaged);
    Deno.exit(0);
}