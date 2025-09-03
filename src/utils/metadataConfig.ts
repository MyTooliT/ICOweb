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

export type ProfileDefinition = {
    id: string;
    name: string;
    pre: ProfilePhase;
    post?: ProfilePhase;
}

type ProfilePhase = Record<CategoryKey, MetadataParameterInformation>

type Datatype = 'text' | 'dropdown' | 'text_suggestions' | 'float' | 'int' | 'boolean' | 'file' | 'text_box';
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