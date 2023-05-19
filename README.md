Astra is a blazingly fast add-on compiler for Minecraft Bedrock. It offers TypeScript compilation using SWC, and build times are significantly faster compared to other compilers. Although Astra does not offer features like Custom Components, it is perfect for those who prioritize speed. 

# Installation

To install Astra, download the latest .exe file from the GitHub Releases tab. Next take that .exe and store it in a good location (e.g. `C:\Program Files\Astra\`), and then add that to your PATH environment variables so the .exe can be used in command prompt and PowerShell.

# Commands

## `[-v | --version]`

This will log the current version of the Astra

## `scaffold`

This command will create a new project in your CWD.

## `package`

This will create a build of your project into the `\dist\` folder in your CWD.

## `watch [--preview]`

This will create a build of your project into `com.mojang`, and will incrementally build any changes made in your project. Use the `preview` flag to build to the preview edition of Minecraft.

# Building

To compile Astra you can run `deno compile src/cli.ts --allow-net --allow-env --allow-read --allow-write`