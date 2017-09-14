import { ConfigurationItem, IDynamicProperty } from "../abstractions";
import { ConfigurationManager } from "../configurationManager";
import * as rx from 'rxjs';
import { System } from "../../globals/system";

export class DynamicProperty<T> implements IDynamicProperty<T> {
    private val: T;
    private removed: boolean;

    private _propertyChanged: rx.ReplaySubject<IDynamicProperty<T>>;

    get propertyChanged(): rx.Observable<IDynamicProperty<T>> {
        if (!this._propertyChanged) {
            this._propertyChanged = new rx.ReplaySubject<IDynamicProperty<T>>(1);
        }
        return <rx.Observable<IDynamicProperty<T>>>this._propertyChanged;
    }

    constructor(private manager: ConfigurationManager, public name: string, private defaultValue) {
        if (!name) {
            this.val = defaultValue;
        }
        else {
            this.val = this.manager.get(name, this.defaultValue);
        }
    }

    get value() {
        return !this.removed ? this.val : undefined;
    }

    set(val: T) {
        if (this.val !== val) {
            this.val = val;
            this.onPropertyChanged();
        }
    }

    updateValue(item: ConfigurationItem) {
        if (item.deleted) {
            this.removed = true;
            System.log.info(null, () => `CONFIG: Removing property value for key ${this.name}`);
            this.onPropertyChanged();
            return;
        }

        if (this.val !== item.value) {
            this.val = item.encrypted ? System.decrypt(item.value) : item.value;
            let v = item.encrypted ? "********" : item.value;
            System.log.info(null, () => `CONFIG: Setting property value '${v}' for key ${this.name}`);
            this.onPropertyChanged();
            return;
        }
    }

    private onPropertyChanged() {
        this._propertyChanged && this._propertyChanged.next(this);
        this.manager.onPropertyChanged(this);
    }

    public dispose() {
        this.onPropertyChanged();
        //this._propertyChanged.dispose();
        this._propertyChanged = null;
    }
}
