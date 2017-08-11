import { IMetrics } from './metrics';
import { StatsdMetrics } from './statsdMetrics';
import { PrometheusMetrics } from './prometheusMetrics';
import { IContainer } from "../di/resolvers";
import { Inject, DefaultServiceNames } from "../di/annotations";
import { ApplicationInsightsMetrics } from "./applicationInsightsMetrics";

export class MetricsWrapper implements IMetrics {

    private metrics: IMetrics;

    constructor(@Inject(DefaultServiceNames.Container) container: IContainer) {
        this.metrics = new ApplicationInsightsMetrics().initialize() || new StatsdMetrics().initialize() || new PrometheusMetrics(container);
    }

    increment(metric: string, customTags?: any, delta?: number) {
        this.metrics.increment(metric, customTags, delta);
    }

    timing(metric: string, duration: number, customTags?: any) {
        this.metrics.timing(metric, duration, customTags);
    }
}