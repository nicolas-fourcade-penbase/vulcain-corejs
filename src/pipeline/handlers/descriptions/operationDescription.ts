export class OperationDescription {
    schema: string;
    kind: "action" | "query" | "get";
    description: string;
    name: string;
    scope: string;
    inputSchema: string;
    outputSchema: string;
    outputCardinality?: string;
    verb: string;
    async: boolean;
    metadata: any;
}
