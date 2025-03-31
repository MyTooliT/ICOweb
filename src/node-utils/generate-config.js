// generate-config.mjs
import fs from 'fs';
import path from 'path';
import xlsx from 'xlsx';
import yaml from 'js-yaml';
import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';

const argv = yargs(hideBin(process.argv))
    .option('input', {
        alias: 'i',
        describe: 'Path to input Excel file',
        default: 'metadata.xlsx',
        type: 'string'
    })
    .option('output', {
        alias: 'o',
        describe: 'Path to output YAML file',
        default: 'metadata.yaml',
        type: 'string'
    })
    .option('types', {
        alias: 't',
        describe: 'Path to output TypeScript declaration file',
        default: 'src/types/yaml.d.ts',
        type: 'string'
    })
    .help()
    .argv;

function toSnakeCase(str) {
    return str
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '_')
        .replace(/^_+|_+$/g, '');
}

function parseWorkbook(filePath) {
    const wb = xlsx.readFile(filePath);
    const zuordnung = xlsx.utils.sheet_to_json(wb.Sheets['Zuordnung'], { header: 1 });
    const listen = xlsx.utils.sheet_to_json(wb.Sheets['Listen'], { header: 1 });

    const infoSheet = wb.Sheets['Info'];
    const info = {};
    if (infoSheet) {
        const infoData = xlsx.utils.sheet_to_json(infoSheet, { header: 1 });
        infoData.forEach(row => {
            if (row[0] && row[1]) {
                info[toSnakeCase(row[0])] = row[1];
            }
        });
    }

    const warnings = [];
    const parameters = {};
    const processes = {};

    const processIDs = zuordnung[1].slice(6).map(id => toSnakeCase(id));
    const processLabels = zuordnung[2].slice(6);

    processIDs.forEach((id, idx) => {
        processes[id] = {
            label: processLabels[idx] || id,
            parameters: {}
        };
    });

    for (let i = 3; i < zuordnung.length; i++) {
        const row = zuordnung[i];
        const rawId = row[2];
        if (!rawId || rawId.toLowerCase() === 'id') continue;

        const id = toSnakeCase(rawId);
        const label = row[1] || id;
        const datatypeRaw = row[3] || 'unknown';
        const unit = row[4] || undefined;
        const type = row[5] || undefined;
        const datatype = datatypeRaw.toLowerCase();

        const paramDef = { id: rawId, label, datatype };
        if (unit) paramDef.unit = unit;
        if (type) paramDef.type = type;

        if (datatype.includes('dropdown') || datatype.includes('vorschl')) {
            const listHeaderRow = listen[2];
            const colIndex = listHeaderRow.findIndex((v) => toSnakeCase(v) === id);

            if (colIndex === -1) {
                warnings.push(`⚠️  No values found in Listen for parameter: ${id}`);
            } else {
                paramDef.options = listen
                    .slice(3)
                    .map(row => row[colIndex])
                    .filter(val => val != null && val !== '...');
            }
        }

        parameters[id] = paramDef;

        processIDs.forEach((procId, idx) => {
            const state = (row[6 + idx] || 'hidden').toLowerCase();
            processes[procId].parameters[id] = state;
        });
    }

    return { info, parameters, processes, warnings };
}

function writeYAML(outputPath, data) {
    const yamlStr = yaml.dump(data, { lineWidth: -1, noRefs: true });
    fs.writeFileSync(outputPath, yamlStr, 'utf8');
    console.log(`✅ YAML written to ${outputPath}`);
}

function writeTypescriptDeclaration(outputPath, yamlPath) {
    const yamlRaw = fs.readFileSync(yamlPath, 'utf8');
    const parsed = yaml.load(yamlRaw);

    const paramStates = new Set();
    const datatypes = new Set();
    const types = new Set();

    for (const process of Object.values(parsed.processes || {})) {
        for (const state of Object.values(process.parameters || {})) {
            paramStates.add(state);
        }
    }

    for (const param of Object.values(parsed.parameters || {})) {
        if (param.datatype) datatypes.add(param.datatype);
        if (param.type) types.add(param.type);
    }

    const hasUnits = Object.values(parsed.parameters || {}).some(p => 'unit' in p);
    const hasOptions = Object.values(parsed.parameters || {}).some(p => 'options' in p);

    const paramStateType = `export type ParameterState = ${[...paramStates].map(s => `'${s}'`).join(' | ')}`;
    const datatypeType = `export type ParameterDatatype = ${[...datatypes].map(d => `'${d}'`).join(' | ')}`;
    const datatypeArray = `export const parameterDatatypes = [${[...datatypes].map(d => `'${d}'`).join(', ')}] as const;`;

    const typeType = `export type ParameterValueType = ${[...types].map(d => `'${d}'`).join(' | ')}`;
    const typeArray = `export const parameterValueTypes = [${[...types].map(d => `'${d}'`).join(', ')}] as const;`;

    const parameterKeys = Object.keys(parsed.parameters || {});
    const parameterKeyType = `export type ParameterKey = ${parameterKeys.map(k => `'${k}'`).join(' | ')}`;
    const parameterKeyArray = `export const parameterKeys = [${parameterKeys.map(k => `'${k}'`).join(', ')}] as const;`;

    const processKeys = Object.keys(parsed.processes || {});
    const processKeyType = `export type ProcessKey = ${processKeys.map(k => `'${k}'`).join(' | ')}`;
    const processKeyArray = `export const processKeys = [${processKeys.map(k => `'${k}'`).join(', ')}] as const;`;

    const paramDefinitionType = `export type ParameterDefinition = {
  id: ParameterKey
  label: string
  datatype: ParameterDatatype${hasUnits ? '\n  unit?: string' : ''}${types.size ? '\n  type?: ParameterValueType' : ''}${hasOptions ? '\n  options?: string[]' : ''}
}`;

    const processDefinitionType = `export type ProcessDefinition = {
  label: string
  parameters: Record<ParameterKey, ParameterState>
}`;

    const infoType = `export type InfoType = {
  ${Object.keys(parsed.info || {}).map(k => `${k}: string`).join('\n  ')}
}`;

    const configType = `export type YamlConfig = {
  info: InfoType
  parameters: Record<ParameterKey, ParameterDefinition>
  processes: Record<ProcessKey, ProcessDefinition>
}`;

    const content = [
        processKeyType,
        '',
        processKeyArray,
        '',
        parameterKeyType,
        '',
        parameterKeyArray,
        '',
        infoType,
        '',
        '// Auto-generated TypeScript declaration based on YAML',
        paramStateType,
        '',
        datatypeType,
        '',
        datatypeArray,
        '',
        typeType,
        '',
        typeArray,
        '',
        paramDefinitionType,
        '',
        processDefinitionType,
        '',
        configType,
        ''
    ].join('\n');

    fs.writeFileSync(outputPath, content, 'utf8');
    console.log(`✅ Type declaration written to ${outputPath}`);
}

function main() {
    const { info, parameters, processes, warnings } = parseWorkbook(argv.input);
    warnings.forEach(w => console.warn(w));

    const outputData = {
        info,
        parameters,
        processes
    };

    writeYAML(argv.output, outputData);
    writeTypescriptDeclaration(argv.types, argv.output);
}

main();
