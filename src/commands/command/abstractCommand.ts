var rest = require('unirest');
import * as types from './types';
import * as os from 'os';
import {ExecutionResult} from './executionResult'
import {Schema} from '../../schemas/schema';
import {IProvider} from '../../providers/provider';
import {DefaultServiceNames} from '../../di/annotations';
import {IContainer} from '../../di/resolvers';
import {Domain} from '../../schemas/schema';
import {Inject} from '../../di/annotations';
import {Pipeline} from '../../servers/requestContext';
import {ActionResponse} from '../../pipeline/actions';
import {QueryResponse} from '../../pipeline/query';
import {ValidationError, ErrorResponse} from '../../pipeline/common';
import { ProviderFactory } from './../../providers/providerFactory';
import { IMetrics } from '../../metrics/metrics';

/**
 * command
 *
 * @export
 * @interface ICommand
 */
export interface ICommand {
    /**
     * execute the command
     * @param args
     */
    executeAsync<T>(...args): Promise<T>;
    /**
     * execution result
     */
    status: ExecutionResult;
}

/**
 * command context initialized for every command
 *
 * @export
 * @interface ICommandContext
 */
export interface ICommandContext {
    /**
     * current user
     */
    user;
    /**
     * is user scope belongs to provided scope
     *
     * @param {string} scope
     * @returns {boolean}
     */
    hasScope(scope: string): boolean;
    /**
     * Is user administrator
     *
     * @returns {boolean} true if user is administrator
     */
    isAdmin(): boolean;
    /**
     * Create and return a new command
     *
     * @param {string} name
     * @returns {ICommand}
     */
    getCommand(name: string): ICommand;
    /**
     * Request correlation id
     *
     * @type {string}
     */
    correlationId: string;

    /**
     * Request correlation path
     *
     * @type {string}
     * @memberOf ICommandContext
     */
    correlationPath: string;
    /**
     * Request cache (Only valid for this request)
     *
     * @type {Map<string, any>}
     */
    cache: Map<string, any>;
    /**
     *
     *
     * @type {Pipeline}
     */
    pipeline: Pipeline;
    /**
     *
     *
     * @type {string}
     */
    tenant: string;
    logError(error: Error, msg?: string);

    /**
     * Log a message info
     *
     * @param {string} msg Message format (can include %s, %j ...)
     * @param {...Array<string>} params Message parameters
     *
     */
    logInfo(msg: string, ...params: Array<any>);

    /**
     * Log a verbose message. Verbose message are enable by service configuration property : enableVerboseLog
     *
     * @param {any} requestContext Current requestContext
     * @param {string} msg Message format (can include %s, %j ...)
     * @param {...Array<string>} params Message parameters
     *
     */
    logVerbose(msg: string, ...params: Array<any>);
}

/**
 *
 *
 * @export
 * @abstract
 * @class AbstractCommand
 * @template T
 */
export abstract class AbstractCommand<T> {
    /**
     *
     *
     * @type {ICommandContext}
     */
    public requestContext:ICommandContext;
    /**
     * Creates an instance of AbstractCommand.
     *
     * @param {IContainer} container
     * @param {any} providerFactory
     */
    constructor(
        @Inject(DefaultServiceNames.Metrics) protected metrics: IMetrics,
        @Inject(DefaultServiceNames.Container) protected container: IContainer) {
    }

    /**
     * execute command
     * @protected
     * @abstract
     * @param {any} args
     * @returns {Promise<T>}
     */
    abstract runAsync(...args): Promise<T>;

    // Must be defined in command
   // protected fallbackAsync(err, ...args)
}
