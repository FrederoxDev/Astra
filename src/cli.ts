import { CompilationTarget, compileAddon, CompilerConfig, getFileInfo, PackType, targetToPath } from "./lib.ts";
import { parse } from "https://deno.land/std@0.181.0/flags/mod.ts";
import {  } from "https://deno.land/std@0.181.0/fs/mod.ts";

const version = "1.0.0";

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
    console.log("commands: [watch] [package]")
    Deno.exit(1);
}

const packConfig: CompilerConfig = {
    packName: "ComputerCraft",
    behaviourPackPath: "\\BP\\",
    resourcePackPath: "\\RP\\"
}

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
            if (destPathExists) 
                await Deno.remove(destPath, { recursive: true });
            
            continue;
        }

        console.log(relativePath, fileInfo.isFile, fileInfo.isDirectory)
    }
}

if (flags._[0] === "package") {
    await compileAddon(packConfig, CompilationTarget.Packaged);
}