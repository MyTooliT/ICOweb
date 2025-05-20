export type ProcessKey = 'milling' | 'drilling' | 'grinding' | 'turning' | 'reaming' | 'shaping' | 'thread_cutting' | 'thread_milling' | 'thread_forming'

export const processKeys = ['milling', 'drilling', 'grinding', 'turning', 'reaming', 'shaping', 'thread_cutting', 'thread_milling', 'thread_forming'] as const;

export type ParameterKey = 'person' | 'institution' | 'machine' | 'experiment' | 'process' | 'activity' | 'workpiece_material' | 'cutting_speed' | 'feed_per_tooth' | 'feed_per_rev' | 'doc_axial' | 'doc_radial' | 'doc' | 'workpiece_diameter' | 'tool_diameter' | 'tool_tooth_count' | 'tool_material' | 'tool_offset' | 'coolant' | 'sth_mac' | 'stu_mac'

export const parameterKeys = ['person', 'institution', 'machine', 'experiment', 'process', 'activity', 'workpiece_material', 'cutting_speed', 'feed_per_tooth', 'feed_per_rev', 'doc_axial', 'doc_radial', 'doc', 'workpiece_diameter', 'tool_diameter', 'tool_tooth_count', 'tool_material', 'tool_offset', 'coolant', 'sth_mac', 'stu_mac'] as const;

export type InfoType = {
  version: string
}

// Auto-generated TypeScript declaration based on YAML
export type ParameterState = 'required' | 'hidden' | 'optional'

export type ParameterDatatype = 'text' | 'dropdown' | 'text_suggestions' | 'float' | 'int'

export const parameterDatatypes = ['text', 'dropdown', 'text_suggestions', 'float', 'int'] as const;

export type ParameterValueType = 'default' | 'range'

export const parameterValueTypes = ['default', 'range'] as const;

export type ParameterDefinition = {
  id: ParameterKey
  label: string
  datatype: ParameterDatatype
  unit?: string
  type?: ParameterValueType
  options?: string[]
}

export type ProcessDefinition = {
  label: string
  parameters: Record<ParameterKey, ParameterState>
}

export type YamlConfig = {
  info: InfoType
  parameters: Record<ParameterKey, ParameterDefinition>
  processes: Record<ProcessKey, ProcessDefinition>
}
