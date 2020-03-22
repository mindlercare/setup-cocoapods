import * as fs from "fs";
import * as path from "path";
import { EOL } from "os";
import * as exec from "@actions/exec";
import * as core from "@actions/core";
import { ExecOptions } from "@actions/exec/lib/interfaces";

export class CocoapodsInstaller {
    public static async install(versionSpec: string): Promise<void> {
        const installedVersion = await this.getInstalledVersion();
        if (installedVersion === versionSpec) {
            core.info(`Cocoapods ${versionSpec} has already installed. Not needed to re-install.`);
            return;
        }

        const uninstallExitCode = await exec.exec("gem", ["uninstall", "cocoapods", "--all", "--executables"]).catch(error => error);
        if (uninstallExitCode !== 0) {
            core.info("Error during deleting existing version of cocoapods");
        }

        const installExitCode = await exec.exec("gem", ["install", "cocoapods", "-v", versionSpec]);
        if (installExitCode !== 0) {
            throw new Error(`Error during install Cocoapods ${versionSpec}`);
        }

        core.info(`Cocoapods ${versionSpec} has installed successfully`);
    }

    public static getVersionFromPodfile(podfilePath: string): string {
        const absolutePath = path.resolve(podfilePath);

        if (!fs.existsSync(absolutePath)) {
            throw new Error(`podfile is not found on path '${absolutePath}'`);
        }

        const fileContent = fs.readFileSync(absolutePath);
        const fileLines = fileContent.toString().split(EOL);
        return fileLines[0];
    }

    private static async getInstalledVersion(): Promise<string | null> {
        let stdOutput = "";
        const options: ExecOptions = {
            listeners: {
                stdout: (data: Buffer): void => {
                    stdOutput += data.toString();
                }
            }
        };

        const exitCode = await exec.exec("pod", ["--version"], options).catch(error => error);
        if (exitCode === 0 && stdOutput) {
            return stdOutput.trim();
        }

        return null;
    }
}