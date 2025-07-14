import {ParameterDefinition} from '@/types/metadata';
import {Quantity} from '@/client';

export function assembleFormEntry(value: any, definition: ParameterDefinition|undefined): Quantity | any {
    if(!definition) return value
    if(definition?.unit) {
        return {
            unit: definition.unit,
            value: value
        }
    } else if(definition?.datatype === 'boolean') {
        return value === 'false' ? false : Boolean(value)
    }
    return value
}