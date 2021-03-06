import { Schema } from '../schemas/schema';
import { IProvider } from '../providers/provider';
import { DefaultServiceNames } from '../di/annotations';
import { IContainer } from '../di/resolvers';
import { Domain } from '../schemas/domain';
import { Inject } from '../di/annotations';
import { IMetrics } from '../instrumentations/metrics';
import { IProviderFactory } from '../providers/provider';
import { Service } from '../globals/system';
import { VulcainLogger } from '../log/vulcainLogger';
import { IRequestContext } from "../pipeline/common";
import { Span } from '../instrumentations/span';
import { ISpanTracker } from '../instrumentations/common';

/**
 *
 *
 * @export
 * @abstract
 * @class AbstractCommand
 * @template T schema
 */
export abstract class AbstractProviderCommand<T> {

    protected providerFactory: IProviderFactory;

    public context: IRequestContext;

    /**
     *
     *
     * @type {IProvider<T>}
     */
    provider: IProvider<T>;
    /**
     *
     *
     * @type {Schema}
     */
    schema: Schema;

    public container: IContainer;

    /**
     * Creates an instance of AbstractCommand.
     *
     * @param {IContainer} container
     * @param {any} providerFactory
     */
    constructor(context: IRequestContext) {
        this.context = context;
        this.container = context.container;
        this.providerFactory = this.container.get<IProviderFactory>(DefaultServiceNames.ProviderFactory);
    }

    /**
     *
     *
     * @param {string} schema
     */
    setSchema(schema: string): string {
        if (schema && !this.provider) {
            this.schema = this.container.get<Domain>(DefaultServiceNames.Domain).getSchema(schema);
            this.provider = this.providerFactory.getConnection(this.context, this.context.user.tenant);
            return this.schema.name;
        }
    }

    protected setMetricTags(verb: string, address: string, schema: string, tenant?: string) {
        Service.manifest.registerProvider(address, schema);
        let tracker = <ISpanTracker>this.context.requestTracker;
        tracker.trackAction(verb);
        tracker.addProviderCommandTags(address, schema, (tenant || this.context.user.tenant));
    }

    // Must be defined in command
    // protected fallback(err, ...args)
}
