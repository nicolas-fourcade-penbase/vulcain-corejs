import { IConfigurationSource } from "../abstractions";
import * as fs from 'fs';

export class EnvironmentVariableSource implements IConfigurationSource {

    get(name: string) {
        // As is
        let env = process.env[name];
        if (env)
            return env;

        // Replace dot
        env = process.env[name.replace(/\./g, '_')];
        if (env)
            return env;

        // Replace dot with uppercases
        env = process.env[name.toUpperCase().replace(/\./g, '_')];
        if (env)
            return env;

        // Transform camel case to upper case
        // ex: myProperty --> MY_PROPERTY
        const regex = /([A-Z])|(\.)/g;
        const subst = `_\$1`;
        let res = name.replace(regex, subst);
        env = process.env[res.toUpperCase()];

        // Otherwise as a docker secret
        if (env === undefined) {
            try {
                // Using sync method here is assumed
                env = fs.readFileSync('/run/secrets/' + name, { encoding: 'utf8', flag: 'r' });
            }
            catch (e) {
                // ignore error
            }
        }
        return env;
    }
}