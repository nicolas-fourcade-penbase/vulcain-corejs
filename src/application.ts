import { Preloader } from './preloader'; // always on first line

import { IActionBusAdapter, IEventBusAdapter } from './bus/busAdapter';
import * as Path from 'path';
import { Domain } from './schemas/domain';
import { Container } from './di/containers';
import { Files } from './utils/files';
import 'reflect-metadata';
import { DefaultServiceNames } from './di/annotations';
import { IContainer } from "./di/resolvers";
import { Conventions } from './utils/conventions';
import { MemoryProvider } from "./providers/memory/provider";
import './defaults/serviceExplorer'; // Don't remove (auto register)
import './defaults/dependencyExplorer'; // Don't remove (auto register)
import { ScopesDescriptor } from './defaults/scopeDescriptors';  // Don't remove (auto register)
import { LifeTime } from "./di/annotations";
import { ServiceDescriptors } from "./pipeline/handlers/serviceDescriptions";
import { HttpResponse } from "./pipeline/response";
import { VulcainServer } from "./pipeline/vulcainServer";
import { LocalAdapter } from "./bus/localAdapter";
import { Service } from './globals/system';
import { DynamicConfiguration } from './configurations/dynamicConfiguration';

const vulcainExecutablePath = __dirname;
const applicationPath = Path.dirname(module.parent.parent.filename);

/**
 * Application base class
 *
 * @export
 * @abstract
 * @class Application
 */
export class Application {
    private _domain: Domain;

    public useMongoProvider(address: string) {
        this.container.useMongoProvider(address);
        return this;
    }

    public useMemoryProvider(folder: string) {
        this.container.useMemoryProvider(folder);
        return this;
    }

    public useRabbitmqBus(address: string) {
        this.container.useRabbitBusAdapter(address);
        return this;
    }

    public useService(name: string, service: Function, lifeTime?: LifeTime) {
        this.container.inject(name, service, lifeTime);
        return this;
    }

    /**
     * Current component container
     * @returns {Container}
     */
    get container() { return this._container; }

    /**
     * Get the current domain model
     * @returns {Domain}
     */
    get domain() {
        return this._domain;
    }

    /**
     * Create new application
     * @param path Files base path for components discovery
     * @param container Global component container
     * @param app  (optional)Server adapter
     */
    constructor(private domainName?: string, private _container?: IContainer) {
        if (!this.domainName) {
            throw new Error("Domain name is required.");
        }

        Service.defaultDomainName = this.domainName;
        this._container = this._container || new Container();
    }

    private async init() {
        await DynamicConfiguration.init().startPolling();

        Service.log.info(null, () => "Starting application");

        this._container.injectInstance(this, DefaultServiceNames.Application);
        this._domain = new Domain(this.domainName, this._container);
        this._container.injectInstance(this._domain, DefaultServiceNames.Domain);

        process.on('unhandledRejection', (reason, p) => {
            Service.log.info(null, () => `Unhandled Rejection at ${p} reason ${reason}")`);
        });

        // Stop to receive inputs
        process.once('SIGTERM', () => {
            let eventBus = this.container.get<IEventBusAdapter>(DefaultServiceNames.EventBusAdapter, true);
            if (eventBus) {
                eventBus.stopReception();
            }
            let commandBus = this.container.get<IActionBusAdapter>(DefaultServiceNames.ActionBusAdapter, true);
            if (commandBus) {
                commandBus.stopReception();
            }
        });
    }

    /**
     * Define all scopes used in this service
     *
     * @protected
     * @param {ScopesDescriptor} scopes Scope definitions manager - Use scopes.defineScope for each scope
     *
     * @memberOf Application
     */
    protected defineScopeDescriptions(scopes: ScopesDescriptor) {
        return this;
    }

    /**
     * Initialize and start application
     *
     * @param {number} port
     */
    async start(port: number) {

        if (!port)
            throw new Error("You must provide a port number");

        try {
            await this.init();

            let local = new LocalAdapter();
            let eventBus = this.container.get<IEventBusAdapter>(DefaultServiceNames.EventBusAdapter, true);
            if (!eventBus) {
                this.container.injectInstance(local, DefaultServiceNames.EventBusAdapter);
                eventBus = local;
            }
            let commandBus = this.container.get<IActionBusAdapter>(DefaultServiceNames.ActionBusAdapter, true);
            if (!commandBus) {
                this.container.injectInstance(local, DefaultServiceNames.ActionBusAdapter);
                commandBus = local;
            }

            this.registerComponents();
            Preloader.instance.runPreloads(this.container, this._domain);

            await eventBus.open();
            await commandBus.open();

            let scopes = this.container.get<ScopesDescriptor>(DefaultServiceNames.ScopesDescriptor);
            this.defineScopeDescriptions(scopes);

            let descriptors = this.container.get<ServiceDescriptors>(DefaultServiceNames.ServiceDescriptors);
            descriptors.getDescriptions(); // ensures handlers table is created

            let server = new VulcainServer(this.domain.name, this._container);
            server.start(port);
        }
        catch (err) {
            Service.log.error(null, err, () => "ERROR when starting application");
            process.exit(2);
        }
    }

    private registerComponents() {
        this.registerRecursive(Path.join(vulcainExecutablePath, "defaults"));

        //let path = Conventions.instance.defaultApplicationFolder;
        //this.registerRecursive(Path.join(applicationPath, path));
        this.registerRecursive(applicationPath);
    }

    /**
     * Discover models components
     * @param path Where to find models component relative to base path (default=/api/models)
     * @returns {Container}
     */
    private registerRecursive(path: string) {
        if (!Path.isAbsolute(path)) {
            path = Path.join(applicationPath, path);
        }
        Files.traverse(path);

        return this._container;
    }

    /**
     * Inject all components from a specific folder (relative to the current folder)
     *
     * @protected
     * @param {string} path Folder path
     * @returns The current application
     */
    public injectFrom(path: string) {
        if (!Path.isAbsolute(path)) {
            path = Path.join(applicationPath, path);
        }
        this._container.injectFrom(path);
        return this;
    }
}