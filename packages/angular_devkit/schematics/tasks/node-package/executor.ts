/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import { TaskExecutor } from '@angular-devkit/schematics';
import { SpawnOptions, spawn } from 'child_process';
import * as path from 'path';
import { Observable } from 'rxjs/Observable';
import { NodePackageTaskFactoryOptions, NodePackageTaskOptions } from './options';

type PackageManagerProfile = {
  quietArgument?: string;
};

const packageManagers: { [name: string]: PackageManagerProfile } = {
  'npm': {
    quietArgument: '--quiet',
  },
  'cnpm': { },
  'yarn': {
    quietArgument: '--silent',
  },
};

export default function(
  factoryOptions: NodePackageTaskFactoryOptions = {},
): TaskExecutor<NodePackageTaskOptions> {
  const packageManagerName = factoryOptions.packageManager || 'npm';
  const packageManagerProfile = packageManagers[packageManagerName];
  if (!packageManagerProfile) {
    throw new Error(`Invalid package manager '${packageManagerName}' requested.`);
  }

  const rootDirectory = factoryOptions.rootDirectory || process.cwd();

  return (options: NodePackageTaskOptions) => {
    const outputStream = process.stdout;
    const errorStream = process.stderr;
    const spawnOptions: SpawnOptions = {
      stdio:  [ process.stdin, outputStream, errorStream ],
      shell: true,
      cwd: path.join(rootDirectory, options.workingDirectory || ''),
    };
    const args = [ options.command ];

    if (options.quiet && packageManagerProfile.quietArgument) {
      args.push(packageManagerProfile.quietArgument);
    }

    return new Observable(obs => {
      spawn(packageManagerName, args, spawnOptions)
        .on('close', (code: number) => {
          if (code === 0) {
            obs.next();
            obs.complete();
          } else {
            const message = 'Package install failed, see above.';
            obs.error(new Error(message));
          }
      });
    });

  };
}