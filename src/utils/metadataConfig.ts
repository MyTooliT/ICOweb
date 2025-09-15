import {Quantity} from '@/client';

export type MetadataConfig = {
    info: MetadataInfo;
    profiles: Record<ProfileKey, ProfileDefinition>;
}

type MetadataInfo = {
    version: string
    generated_at: string
}

export type MetadataParameterInformation = {
    id: string;
    label: string;
    datatype: Datatype;
    type: MetadataType;
    required: string;
    default?: any;
    description?: string;
    unit?: string;
    options?: readonly string[];
}

export type MetadataParameterBase<T, U extends Datatype> = {
    id: string;
    label: string;
    datatype: U;
    type: MetadataType;
    required: string;
    default?: T;
    description?: string;
}

export type Unit = {unit: string}

export type MetadataParameterAutocomplete = MetadataParameterBase<string, 'text_suggestions'> & {
    options: readonly string[];
}
export type MetadataParameterInt = MetadataParameterBase<number, 'int'>
export type MetadataParameterFloat = MetadataParameterBase<number, 'float'>
export type MetadataParameterFloatQty = MetadataParameterBase<Quantity, 'float_qty'> & Unit
export type MetadataParameterIntQty = MetadataParameterBase<Quantity, 'int_qty'> & Unit
export type MetadataParameterBool = MetadataParameterBase<boolean, 'boolean'>
export type MetadataParameterImage = MetadataParameterBase<string, 'image'>
export type MetadataParameterTextBox = MetadataParameterBase<string, 'text_box'>
export type MetadataParameterText = MetadataParameterBase<string, 'text'>
export type MetadataParameterDropdown = MetadataParameterBase<string, 'dropdown'> & { options: readonly string[] }


export type AnyMetadataParameterDefinition =
    MetadataParameterAutocomplete
    | MetadataParameterInt
    | MetadataParameterFloat
    | MetadataParameterFloatQty
    | MetadataParameterIntQty
    | MetadataParameterBool
    | MetadataParameterImage
    | MetadataParameterTextBox
    | MetadataParameterText
    | MetadataParameterDropdown

type WithUnit = Extract<AnyMetadataParameterDefinition, Unit>; // the union of definitions that include `unit`

export function hasUnit(
    def: AnyMetadataParameterDefinition
): def is WithUnit {
    return typeof (def as any).unit === 'string';
}

export type MetadataPhaseKey = 'pre' | 'post';

export type ProfileDefinition = {
    id: string;
    name: string;
    pre: ProfilePhase;
    post?: ProfilePhase;
}

export type ProfilePhase = Record<CategoryKey, MetadataParameterInformation>

type Datatype = 'text' | 'dropdown' | 'text_suggestions' | 'float' | 'int' | 'float_qty' | 'int_qty' | 'boolean' | 'image' | 'text_box';
type MetadataType = 'default' | 'implementation' | 'range'
type ProfileKey = string;
type CategoryKey = string;
export type ParameterKey = string;


/**
 * Extracts and returns a list of parameter keys from a given profile definition where the parameters are marked as required.
 *
 * @param {ProfilePhase} profilePhase - The profile phase definition containing parameter categories and their details.
 * @return {ParameterKey[]} An array of parameter keys that are marked as required.
 */
export function getRequiredParameterKeysForPhase(profilePhase: ProfilePhase): ParameterKey[] {
    const params: ParameterKey[] = []
    const categoriesInPhase = Object.values(profilePhase)
    categoriesInPhase.forEach(category => {
        Object.values(category).forEach(par => {
            if(par.required === 'required') {
                params.push(par.id)
            }
        })
    })

    return params
}


export function getAllParameterKeysForPhase(profilePhase: ProfilePhase): ParameterKey[] {
    const params: ParameterKey[] = []
    const categoriesInPhase = Object.values(profilePhase)
    categoriesInPhase.forEach(category => {
        Object.values(category).forEach(par => {
            params.push(par.id)
        })
    })

    return params
}


/**
 * Transforms a given value according to the provided metadata definition.
 *
 * @param {any} value - The value to be formatted or transformed.
 * @param {MetadataParameterInformation} definition - Metadata configuration that determines how the value should be assembled.
 * @return {Quantity | any} Returns a transformed value or an object containing the unit and value if a unit is defined in the metadata.
 */
export function assembleFormEntry(value: any, definition: MetadataParameterInformation): Quantity | any {
    if(definition.unit) {
        return {
            unit: definition.unit,
            value: value
        }
    } else if(definition.datatype === 'boolean') {
        return value === 'false' ? false : Boolean(value)
    }
    // we skip the case of 'file' because it is handled separately
    return value
}

export function assembleValue(parameter: AnyMetadataParameterDefinition, value: any): any {
    switch(parameter.datatype) {
        case 'float_qty':
        case 'int_qty':
            return {
                unit: parameter.unit,
                value: value
            } as Quantity
        default:
            return value
    }
}

export function getDefaultsObject(phase: ProfilePhase, restrictedOnly: boolean = false): Record<string, any> {
    const retObj: Record<string, any> = {}
    Object.values(phase).forEach(category => {
        Object.entries(category).forEach(([key, value]: [string, AnyMetadataParameterDefinition]) => {
            if(value.default) {
                if(restrictedOnly) {
                    if(value.required === 'restricted' || value.type === 'implementation') {
                        retObj[key] = assembleValue(value, value.default)
                    }
                } else {
                    retObj[key] = assembleValue(value, value.default)
                }
            }
        })
    })
    return retObj
}

export function computeValidity(stateObject: Record<string, any>, phase: ProfilePhase): boolean {
    const requiredParams = getRequiredParameterKeysForPhase(phase)
    for(const param of requiredParams) {
        if(!stateObject[param]) {
            // parameter is required but not set
            return false
        }
        let formValue = stateObject[param]
        if(formValue && typeof formValue === 'object') {
            // either Quantity or files
            if('value' in formValue && 'unit' in formValue) {
                // Quantity
                formValue = formValue.value
            } else {
                // files
                formValue = Object.values(formValue)[0]
            }
        }
        if(formValue === null || formValue === undefined || formValue === '') {
            return false
        }
    }
    return true
}

export function setRestrictedDefaults(stateObject: Record<string, any>, phase: ProfilePhase) {
    const defaults = getDefaultsObject(phase, true)
    Object.entries(defaults).forEach(([key, value]) => {
        stateObject[key] = value
    })
}

export function setDefaultsIfEmpty(stateObject: Record<string, any>, phase: ProfilePhase) {
    const defaults = getDefaultsObject(phase)
    Object.keys(defaults).forEach(key => {
        if(stateObject[key] === undefined || stateObject[key]) {
            stateObject[key] = defaults[key]
        }
    })
}

export function removeUnusedParams(stateObject: Record<string, any>, phase: ProfilePhase) {
    const params = getAllParameterKeysForPhase(phase)
    Object.keys(stateObject).forEach(param => {
        if(!params.includes(param)) {
            delete stateObject[param]
        }
    })
}

export function clearEntries(stateObject: Record<string, any>) {
    Object.keys(stateObject).forEach(param => {
        delete stateObject[param]
    })
}