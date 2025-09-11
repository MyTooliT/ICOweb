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