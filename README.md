# Installation

To install Astra, download the latest .exe file from the GitHub Releases tab. Next take that .exe and store it in a good location (e.g. `C:\Program Files\Astra\`), and then add that to your PATH environment variables so the .exe can be used in command prompt and PowerShell.

# Features

The compiler has been built for speed, not features. Features offered by other compilers like `Custom Components` do not currently exist inside of Astra. Therefore you may want to chose those compilers if you need those features. Astra does offer `TypeScript` compilation using `SWC` and build times are significantly faster compared to other compilers.

# Commands

## `[-v | --version]`

This will log the current version of the Astra

## `scaffold`

This command will create a new project in your CWD.

## `package`

This will create a build of your project into the `\dist\` folder in your CWD.

## `watch [--preview]`

This will create a build of your project into `com.mojang`, and will incrementally build any changes made in your project. Use the `preview` flag to build to the preview edition of Minecraft.
