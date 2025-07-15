// Auto-generated from metadata.yaml

export const requirementList = ['Required', 'Optional', 'Hidden', 'Restricted'] as const;
export type Requirement = typeof requirementList[number];

export const coolantList = ['Dry', 'Air', 'MMQ', 'Flood', 'Oil'] as const;
export type Coolant = typeof coolantList[number];

export const institutionList = ['TU Wien', 'TU Darmstadt'] as const;
export type Institution = typeof institutionList[number];

export const workpiece_materialList = ['C45', 'Steel'] as const;
export type Workpiece_material = typeof workpiece_materialList[number];

export const tool_materialList = ['Carbide (P40)', 'Carbide', 'MCD', 'Ceramic', 'PCD'] as const;
export type Tool_material = typeof tool_materialList[number];

export const processList = ['Milling', 'Drilling', 'Grinding', 'Turning', 'Reaming', 'Thread Cutting', 'Thread Forming', 'Thread Milling'] as const;
export type Process = typeof processList[number];

export const directionList = ['Climb', 'Conventional'] as const;
export type Direction = typeof directionList[number];

export type Datatype = 'text' | 'dropdown' | 'text_suggestions' | 'float' | 'int' | 'boolean' | 'file' | 'text_box';

export interface ParameterDefinition {
  id: string;
  label: string;
  datatype: Datatype;
  type?: string;
  options?: readonly string[];
  unit?: string;
}

export interface Parameters {
  person: ParameterDefinition;
  institution: ParameterDefinition;
  machine: ParameterDefinition;
  experiment: ParameterDefinition;
  process: ParameterDefinition;
  workpiece_material: ParameterDefinition;
  cutting_speed: ParameterDefinition;
  feed_per_tooth: ParameterDefinition;
  feed_per_rev: ParameterDefinition;
  doc_axial: ParameterDefinition;
  doc_radial: ParameterDefinition;
  doc: ParameterDefinition;
  workpiece_diameter: ParameterDefinition;
  tool_diameter: ParameterDefinition;
  tool_tooth_count: ParameterDefinition;
  tool_material: ParameterDefinition;
  tool_offset: ParameterDefinition;
  coolant: ParameterDefinition;
  sth_mac: ParameterDefinition;
  stu_mac: ParameterDefinition;
  tool_breakage: ParameterDefinition;
  first_tool_wear_exceeded: ParameterDefinition;
  first_wear_mark_width: ParameterDefinition;
  first_max_wear_mark_width: ParameterDefinition;
  second_wear_mark_width: ParameterDefinition;
  second_max_wear_mark_width: ParameterDefinition;
  second_tool_wear_exceeded: ParameterDefinition;
  twm_layer: ParameterDefinition;
  pictures: ParameterDefinition;
  comment: ParameterDefinition;
  direction: ParameterDefinition;
  n_cuts: ParameterDefinition;
  n_measurement: ParameterDefinition;
  first_pictures: ParameterDefinition;
  second_pictures: ParameterDefinition;
}

export const ParameterList = ['person', 'institution', 'machine', 'experiment', 'process', 'workpiece_material', 'cutting_speed', 'feed_per_tooth', 'feed_per_rev', 'doc_axial', 'doc_radial', 'doc', 'workpiece_diameter', 'tool_diameter', 'tool_tooth_count', 'tool_material', 'tool_offset', 'coolant', 'sth_mac', 'stu_mac', 'tool_breakage', 'first_tool_wear_exceeded', 'first_wear_mark_width', 'first_max_wear_mark_width', 'second_wear_mark_width', 'second_max_wear_mark_width', 'second_tool_wear_exceeded', 'twm_layer', 'pictures', 'comment', 'direction', 'n_cuts', 'n_measurement', 'first_pictures', 'second_pictures'] as const;
export type Parameter = typeof ParameterList[number];

export interface Info {
  version: string;
  generated_at: string;
}

export type Category =
  'general' |
  'hardware' |
  'process' |
  'files' |
  'additional' |
  'results' |
  'first_ce' |
  'second_ce';

export type ProfileParamDefinition = Partial<{ required: string; default: any; description: string }>;

export type ProfileCategory = Record<Parameter, ProfileParamDefinition>

export type ProfilePhase = Record<Category, ProfileCategory>;

export interface Profile {
  id: string;
  name: string;
  pre: ProfilePhase;
  post?: ProfilePhase;
}

export interface Profiles {
  'twm1': Profile;
  'twm2': Profile;
  'milling': Profile;
}

export interface MetadataConfig {
  info: Info;
  parameters: Parameters;
  categories: Record<Category, string>;
  lists: Record<string, readonly string[]>;
  profiles: Profiles;
}