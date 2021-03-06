import { IConfigurationSource, IRemoteConfigurationSource } from "../abstractions";

export class PrioritizedSourceValue implements IConfigurationSource {
    private chain: IConfigurationSource[];

    get remoteSources() {
        return this._remoteSources;
    }

    constructor( localSources?: IConfigurationSource[], private _remoteSources?: IRemoteConfigurationSource[]) {
        this.chain = [];
        if (_remoteSources)
            this.chain = this.chain.concat(_remoteSources);
        else {
            this._remoteSources = [];
        }
        if (localSources)
            this.chain = this.chain.concat(localSources);
    }

    get(name: string) {
        for (let pv of this.chain) {
            let val = pv.get(name);
            if (val !== undefined) return val;
        }
        return undefined;
    }
}