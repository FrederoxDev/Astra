import { CompilationTarget, compileAddon, CompilerConfig } from "./lib.ts";
import { parse } from "https://deno.land/std@0.181.0/flags/mod.ts";

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
    behaviourPackPath: "/BP/",
    resourcePackPath: "/RP/"
}

if (flags._[0] === "watch") {
    await compileAddon(packConfig, flags.preview ? CompilationTarget.Preview : CompilationTarget.Stable);

    console.log("Starting watch mode...")
    // Todo: Watch both RP And BP
    let watcher = Deno.watchFs(Deno.cwd() + packConfig.behaviourPackPath);

    for await (const event of watcher) {
        console.log(">>>> event", event);
    }
}

if (flags._[0] === "package") {
    await compileAddon(packConfig, CompilationTarget.Packaged);
}