import { DefaultServiceNames, Inject, LifeTime } from '../di/annotations';
import { IContainer } from "../di/resolvers";
import { Domain } from '../schemas/schema';
import { Model, Property } from '../schemas/annotations';
import { QueryHandler } from "../pipeline/handlers/annotations.handlers";
import { Query } from "../pipeline/handlers/annotations";
import { RequestContext } from "../pipeline/requestContext";
import { ForbiddenRequestError } from "../pipeline/errors/applicationRequestError";
import { ServiceDescriptors, ServiceDescription } from "../pipeline/handlers/serviceDescriptions";


@Model()
export class ServiceExplorerParameter {
    @Property({ description: "Format the description service. Only 'swagger' are available", type: "string" })
    format: string;
}

@QueryHandler({ scope: "?", serviceLifeTime: LifeTime.Singleton })
export class ServiceExplorer {

    constructor( @Inject(DefaultServiceNames.Domain) private domain: Domain,
        @Inject(DefaultServiceNames.Container) private container: IContainer) {
    }

    @Query({ outputSchema: "ServiceDescription", description: "Get all service handler description. You can get the response on swagger format.", action: "_serviceDescription" })
    async getServiceDescriptions(model: ServiceExplorerParameter) {
        let ctx: RequestContext = (<any>this).requestContext;
        if (ctx.publicPath)
            throw new ForbiddenRequestError();

        let descriptors = this.container.get<ServiceDescriptors>(DefaultServiceNames.ServiceDescriptors);
        let result: ServiceDescription = await descriptors.getDescriptions();
        result.alternateAddress = (<any>this).requestContext.hostName;

        // TODO        
        if (model.format === 'swagger') {
            /*
            let descriptors = this.container.get<SwaggerServiceDescriptor>(DefaultServiceNames.SwaggerServiceDescriptor);
            let swaggerResult: SwaggerApiDefinition = await descriptors.getDescriptionsAsync(result);
            let response = new HttpResponse();
            response.content = swaggerResult;
            return response;
            */

        } else {
            return result;
        }


    }

}