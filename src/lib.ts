import { copySync, emptyDirSync, copy } from "https://deno.land/std@0.181.0/fs/mod.ts";
import { transform } from "https://deno.land/x/swc@0.2.1/mod.ts";

/**
 * Stores the intended compilation target
 */
export enum Target {
    /**Export directly as a .mcaddon File*/
    Packaged,
    /**Export to the stable version of minecraft */
    Stable,
    /**Export to the preview version of minecraft */
    Preview
}

/**
 * Stores settings related to the compiler
 */
export interface CompilerConfig {
    packName: string,
    behaviourPackPath?: string,
    resourcePackPath?: string
}

/**
 * Compiles the entire pack 
 */
export async function compileAddon(config: CompilerConfig): Promise<void> {
    let count = 0;
    const start = performance.now();

    if (config.behaviourPackPath !== undefined) {
        count += await compileDirectory(config.behaviourPackPath);
    } 

    if (config.resourcePackPath !== undefined) {
        count += await compileDirectory(config.resourcePackPath);
    } 

    const timeTaken = performance.now() - start;
    console.log(`Compiled ${count} files in ${timeTaken}ms`)
}

/**
 * Compiles a specific directory
 */
async function compileDirectory(path: string): Promise<number> {
    let fileCount = 0;
    const packDir = Deno.cwd() + path;
    const destDir = Deno.cwd() + "/Packaged/" + path;
    emptyDirSync(destDir);

    // Go through each file & Directory
    for await (const dirEntry of Deno.readDirSync(Deno.cwd() + path)) {
        if (dirEntry.isFile) {
            fileCount += 1;
            compileFile(packDir, destDir, dirEntry.name);
        }
        else if (dirEntry.isDirectory) {
            fileCount += await compileDirectory(path + `${dirEntry.name}/`)
        }
    }

    return fileCount;
}

async function compileFile(packPath: string, destPath: string, fileName: string) {
    if (fileName.endsWith(".ts")) {
        const fileText = await Deno.readTextFile(packPath + `/${fileName}`);
        const transpiledJs = transform(fileText, {
            jsc: {
                target: "es2021",
                parser: {
                  syntax: "typescript",
                },
            },
        }).code;
        await Deno.writeTextFile(destPath + `/${fileName.replace(".ts", ".js")}`, transpiledJs)
    }
    else {
        await copy(`${packPath}/${fileName}`, `${destPath}/${fileName}`, { overwrite: true })
    }
}