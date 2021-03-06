import { expect } from 'chai';
import { Model } from '../../src/schemas/builder/annotations.model';
import { Property } from '../../src/schemas/builder/annotations.property';
import { Domain } from '../../src/schemas/domain';
import { TestContext } from '../../src/pipeline/testContext';

@Model()
class SimpleModel {
    @Property({ type: "string" })
    normal: string;
    @Property({ type: "string", sensible: true })
    password: string;
}

@Model()
class AggregateModel {
    @Property({ type: "SimpleModel", cardinality: "one" })
    simple: SimpleModel;
}

let context = new TestContext();

describe("Sensible data", function () {

    it("should encrypt sensible properties", () => {
        let model = { normal: "normal", password: "password" };
        let domain = context.rootContainer.get<Domain>("Domain");
        let schema = domain.getSchema("SimpleModel");
        schema.encrypt(model);
        expect(model.normal).equals("normal");
        expect(model.password).not.eq("password");
    });

    it("should encrypt embedded sensible properties", () => {
        let model = { simple: { normal: "normal", password: "password" } };
        let domain = context.rootContainer.get<Domain>("Domain");
        let schema = domain.getSchema("AggregateModel");
        schema.encrypt(model);
        expect(model.simple.normal).equals("normal");
        expect(model.simple.password).not.eq("password");
    });

    it("should decrypt sensible properties", () => {
        let model = { normal: "normal", password: "password" };
        let domain = context.rootContainer.get<Domain>("Domain");
        let schema = domain.getSchema("SimpleModel");
        schema.encrypt(model);
        schema.decrypt(model);
        expect(model.normal).equals("normal");
        expect(model.password).equals("password");
    });

    it("should remove sensible properties", () => {
        let model = { normal: "normal", password: "password" };
        let domain = context.rootContainer.get<Domain>("Domain");
        let schema = domain.getSchema("SimpleModel");
        schema.obfuscate(model);
        expect(model.normal).equals("normal");
        expect(model.password).to.be.undefined;
    });
});