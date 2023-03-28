import { copySync, emptyDirSync } from "https://deno.land/std@0.181.0/fs/mod.ts";
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
    behaviourPackPath?: string 
}

/**
 * Compiles the entire pack 
 */
export function compileAddon(config: CompilerConfig): void {
    if (config.behaviourPackPath !== undefined) {
        const start = new Date().getMilliseconds()
        const fileCount = compileDirectory(config.behaviourPackPath);
        const timeTaken = new Date().getMilliseconds() - start;
        console.log(`[BP] Compiled ${fileCount} files in ${timeTaken}ms`)
    } 
}

/**
 * Compiles a specific directory
 */
function compileDirectory(path: string): number {
    let fileCount = 0;
    const packDir = Deno.cwd() + path;
    const destDir = Deno.cwd() + "/Packaged/" + path;
    emptyDirSync(destDir);

    // Go through each file & Directory
    for (const dirEntry of Deno.readDirSync(Deno.cwd() + path)) {
        if (dirEntry.isFile) {
            fileCount += 1;
            compileFile(packDir, destDir, dirEntry.name);
            // copySync();
        }
        else if (dirEntry.isDirectory) {
            fileCount += compileDirectory(path + `${dirEntry.name}/`)
        }
    }

    return fileCount;
}

function compileFile(packPath: string, destPath: string, fileName: string) {
    if (fileName.endsWith(".ts")) {
        const fileText = Deno.readTextFileSync(packPath + `/${fileName}`);
        const transpiledJs = transform(fileText, {
            jsc: {
                target: "es2016",
                parser: {
                  syntax: "typescript",
                }
            }
        }).code;
        Deno.writeTextFileSync(packPath + `/${fileName.replace(".ts", ".js")}`, transpiledJs)
    }
    else {
        copySync(`${packPath}/${fileName}`, `${destPath}/${fileName}`, { overwrite: true })
    }
}