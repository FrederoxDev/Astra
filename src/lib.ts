import { emptyDirSync, copy } from "https://deno.land/std@0.181.0/fs/mod.ts";
import { transform } from "https://deno.land/x/swc@0.2.1/mod.ts";

const localAppData = Deno.env.get('localappdata');
const stablePackage = "Microsoft.MinecraftUWP_8wekyb3d8bbwe";
const previewPackage = "Microsoft.MinecraftWindowsBeta_8wekyb3d8bbwe";
const comMojang = "LocalState\\games\\com.mojang"


/**
 * Stores the intended compilation target
 */
export enum CompilationTarget {
    /**Export directly as a .mcaddon File*/
    Packaged,
    /**Export to the stable version of minecraft */
    Stable,
    /**Export to the preview version of minecraft */
    Preview
}

export enum PackType {
    Behaviour,
    Resource
}

/**
 * Stores settings related to the compiler
 */
export interface CompilerConfig {
    packName: string,
    behaviourPackPath?: string,
    resourcePackPath?: string
}

export async function getFileInfo(path: string): Promise<Deno.FileInfo | undefined> {
    try {
        const res = await Deno.stat(path);
        return res;
    }
    catch (err) {
        if (err instanceof Deno.errors.NotFound) {
            return undefined;
        }

        throw err;
    }
}

export async function compileAddon(config: CompilerConfig, target: CompilationTarget): Promise<void> {
    let count = 0;
    const start = performance.now();
    console.log("Starting addon compilation...")

    if (config.behaviourPackPath !== undefined) {
        count += await compileDirectory("", target, PackType.Behaviour, config.packName);
    } 

    if (config.resourcePackPath !== undefined) {
        count += await compileDirectory("", target, PackType.Resource, config.packName);
    } 

    const timeTaken = performance.now() - start;
    console.log(`Compiled ${count} files in ${timeTaken}ms`)
}

export function targetToPath(target: CompilationTarget, packType: PackType, packName: string): string {
    const packPath = packType === PackType.Behaviour ? "BP" : "RP";
    const folderName = packType === PackType.Behaviour ? "development_behavior_packs" : "development_resource_packs";

    if (target === CompilationTarget.Packaged) {
        return `${Deno.cwd()}\\dist\\${packName} ${packPath}\\`
    }

    else if (target === CompilationTarget.Stable) {
        return `${localAppData}\\Packages\\${stablePackage}\\${comMojang}\\${folderName}\\${packName} ${packPath}\\`
    }

    else if (target === CompilationTarget.Preview) {
        return `${localAppData}\\Packages\\${previewPackage}\\${comMojang}\\${folderName}\\${packName} ${packPath}\\`
    }

    throw new Error(`Unknown Pack Type ${packType}`);
}

async function compileDirectory(path: string, target: CompilationTarget, packType: PackType, packName: string): Promise<number> {
    let fileCount = 0;
    const packDir = Deno.cwd() + (packType === PackType.Behaviour ? "\\BP\\" : "\\RP\\") + path;
    const destDir = targetToPath(target, packType, packName) + path;
    emptyDirSync(destDir);

    // Go through each file & Directory
    for await (const dirEntry of Deno.readDirSync(packDir)) {
        if (dirEntry.isFile) {
            fileCount += 1;
            compileFile(packDir, destDir, dirEntry.name);
        }
        else if (dirEntry.isDirectory) {
            fileCount += await compileDirectory(path + `${dirEntry.name}\\`, target, packType, packName)
        }
    }

    return fileCount;
}

async function compileFile(packPath: string, destPath: string, fileName: string) {
    if (fileName.endsWith(".ts")) {
        const fileText = await Deno.readTextFile(packPath + `\\${fileName}`);
        const transpiledJs = transform(fileText, {
            jsc: {
                target: "es2021",
                parser: {
                  syntax: "typescript",
                },
            },
        }).code;
        await Deno.writeTextFile(destPath + `${fileName.replace(".ts", ".js")}`, transpiledJs)
    }
    else {
        await copy(`${packPath}\\${fileName}`, `${destPath}${fileName}`, { overwrite: true })
    }
}