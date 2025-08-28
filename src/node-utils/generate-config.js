// src/node-utils/generate-full.js
import xlsx from 'xlsx';
import fs from 'fs';
import path from 'path';
import yaml from 'js-yaml';

function normalizeKey(key) {
    if (typeof key !== 'string') return null;
    return key.trim().toLowerCase().replace(/\s+/g, '_');
}

function loadWorkbook(filePath) {
    return xlsx.readFile(filePath);
}

function parseFields(sheet) {
    const rows = xlsx.utils.sheet_to_json(sheet, { defval: '' });
    const parameters = {};

    for (const row of rows) {
        const param = {};
        // normalize all columns
        for (const [key, value] of Object.entries(row)) {
            const nk = normalizeKey(key);
            if (!nk) continue;
            // skip unit if empty
            if (nk === 'unit' && String(value).trim() === '') continue;
            param[nk] = value;
        }

        const id = normalizeKey(param['id'] || param['field_id']);
        if (!id) continue;
        parameters[id] = param;
    }

    return parameters;
}

function parseLists(sheet) {
    const data = xlsx.utils.sheet_to_json(sheet, { header: 1, defval: '' });
    if (data.length === 0) return {};
    const headers = data[0].map(h => normalizeKey(h));
    const lists = {};
    headers.forEach(id => { if (id) lists[id] = []; });
    for (let i = 1; i < data.length; i++) {
        const row = data[i];
        headers.forEach((id, j) => {
            const val = row[j];
            if (id && val !== undefined && val !== '') lists[id].push(val);
        });
    }
    return lists;
}

function parseInfo(sheet) {
    const data = xlsx.utils.sheet_to_json(sheet, { header: 1, defval: '' });
    const info = {};
    data.forEach(row => {
        const key = row[0];
        const value = row[1];
        if (key && value !== undefined && value !== '') {
            info[normalizeKey(key)] = value;
        }
    });
    return info;
}

function parseCategories(sheet) {
    const rows = xlsx.utils.sheet_to_json(sheet, { defval: '' });
    const categories = {};
    rows.forEach(row => {
        const id = normalizeKey(row['id']);
        if (!id) return;
        categories[id] = row['display_name'] || id;
    });
    return categories;
}

function parsePhase(sheet, parameters) {
    const rows = xlsx.utils.sheet_to_json(sheet, { defval: '', range: 3 });
    const phaseData = {};
    rows.forEach(row => {
        const norm = {};
        for (const [key, value] of Object.entries(row)) {
            const nk = normalizeKey(key);
            if (nk) norm[nk] = value;
        }
        const fieldId = normalizeKey(norm['field_id'] || norm['id']);
        if (!fieldId || !parameters[fieldId]) return;
        const category = normalizeKey(norm['category'] || 'general');
        phaseData[category] = phaseData[category] || {};
        const details = {};
        if (norm['required'] !== undefined && norm['required'] !== '') {
            details.required = normalizeKey(norm['required']);
        }
        if (norm['default'] !== undefined && norm['default'] !== '') {
            details.default = norm['default'];
        }
        if (norm['description'] !== undefined && norm['description'] !== '') {
            details.description = norm['description'];
        }
        phaseData[category][fieldId] = details;
    });
    return phaseData;
}

function parseProfiles(wb, parameters) {
    const profiles = {};
    const preSheets = wb.SheetNames.filter(n => n.toLowerCase().startsWith('pre_'));
    const bases = [...new Set(preSheets.map(n => normalizeKey(n).replace(/^pre_/, '')))];
    bases.forEach(base => {
        const profile = {};
        const preSheet = wb.Sheets[`pre_${base}`] || wb.Sheets[`PRE_${base}`];
        if (preSheet) {
            const idCell   = preSheet['B1'];
            const nameCell = preSheet['B2'];
            profile.id   = idCell   && idCell.v   ? normalizeKey(idCell.v)   : base;
            profile.name = nameCell && nameCell.v ? nameCell.v : base;
            profile.pre  = parsePhase(preSheet, parameters);
        }
        const postSheet = wb.Sheets[`post_${base}`] || wb.Sheets[`POST_${base}`];
        if (postSheet) profile.post = parsePhase(postSheet, parameters);
        profiles[base] = profile;
    });
    return profiles;
}

function generateTs(config) {
    const lines = [];
    lines.push('// Auto-generated from metadata.yaml');
    lines.push('');

    // Lists as const arrays and types
    Object.entries(config.lists).forEach(([listId, values]) => {
        const constName = `${listId}List`;
        const typeName  = `${listId.charAt(0).toUpperCase() + listId.slice(1)}`;
        lines.push(`export const ${constName} = [${values.map(v => `'${v}'`).join(', ')}] as const;`);
        lines.push(`export type ${typeName} = typeof ${constName}[number];`);
        lines.push('');
    });

    // Datatype union
    const datatypes = new Set(Object.values(config.parameters).map(p => p.datatype));
    lines.push(`export type Datatype = ${[...datatypes].map(dt => `'${dt}'`).join(' | ')};`);
    lines.push('');

    // ParameterDefinition interface
    const paramProps = new Set();
    Object.values(config.parameters).forEach(p => Object.keys(p).forEach(k => paramProps.add(k)));
    lines.push('export interface ParameterDefinition {');
    paramProps.forEach(prop => {
        switch(prop) {
            case 'id':
            case 'label':
                lines.push(`  ${prop}: string;`);
                break;
            case 'datatype':
                lines.push(`  ${prop}: Datatype;`);
                break;
            case 'options':
                lines.push(`  ${prop}?: readonly string[];`);
                break;
            default:
                lines.push(`  ${prop}?: string;`);
        }
    });
    lines.push('}');
    lines.push('');

    // Parameters map
    lines.push('export interface Parameters {');
    Object.keys(config.parameters).forEach(id => {
        lines.push(`  ${id}: ParameterDefinition;`);
    });
    lines.push('}');
    lines.push('');

    // --- New: add readonly const array of Parameter (parameter IDs) ---
    const paramIds = Object.keys(config.parameters);
    lines.push(`export const ParameterList = [${paramIds.map(id => `'${id}'`).join(', ')}] as const;`);
    lines.push('export type Parameter = typeof ParameterList[number];');
    lines.push('');

    // Info interface (skip duplicate generated_at)
    lines.push('export interface Info {');
    Object.keys(config.info)
        .filter(key => key !== 'generated_at')
        .forEach(key => {
            lines.push(`  ${key}: string;`);
        });
    lines.push('  generated_at: string;');
    lines.push('}');
    lines.push('');

    // Category union
    lines.push('export type Category =');
    Object.keys(config.categories).forEach((cat, i, arr) => {
        const sep = i === arr.length - 1 ? ';' : ' |';
        lines.push(`  '${cat}'${sep}`);
    });
    lines.push('');

    // ProfileParamDefinition alias
    lines.push('export type ProfileParamDefinition = Partial<{ required: string; default: any; description: string }>;');
    lines.push('');
    lines.push('export type ProfileCategory = Record<Parameter, ProfileParamDefinition>');
    lines.push('');

    // ProfilePhase type alias
    lines.push('export type ProfilePhase = Record<Category, ProfileCategory>;');
    lines.push('');

    // Profile interface
    lines.push('export interface Profile {');
    lines.push('  id: string;');
    lines.push('  name: string;');
    lines.push('  pre: ProfilePhase;');
    lines.push('  post?: ProfilePhase;');
    lines.push('}');
    lines.push('');

    // Profiles map
    lines.push('export interface Profiles {');
    Object.keys(config.profiles).forEach(key => {
        lines.push(`  '${key}': Profile;`);
    });
    lines.push('}');
    lines.push('');

    // MetadataConfig
    lines.push('export interface MetadataConfig {');
    lines.push('  info: Info;');
    lines.push('  parameters: Parameters;');
    lines.push('  categories: Record<Category, string>;');
    lines.push('  lists: Record<string, readonly string[]>;');
    lines.push('  profiles: Profiles;');
    lines.push('}');

    return lines.join('\n');
}

function generateConfig(excelPath) {
    const wb = loadWorkbook(excelPath);
    const config = { info: {}, parameters: {}, categories: {}, lists: {}, profiles: {} };

    if (wb.Sheets['fields'])     config.parameters = parseFields(wb.Sheets['fields']);
    if (wb.Sheets['lists'])      config.lists      = parseLists(wb.Sheets['lists']);
    if (wb.Sheets['info'])       config.info       = parseInfo(wb.Sheets['info']);
    // append generated_at only once
    if (!config.info.generated_at) {
        config.info.generated_at = new Date().toISOString();
    }
    if (wb.Sheets['categories']) config.categories  = parseCategories(wb.Sheets['categories']);
    config.profiles = parseProfiles(wb, config.parameters);

    // augment parameters with options for dropdown or text_suggestions
    Object.entries(config.parameters).forEach(([paramId, param]) => {
        if (param.datatype && ['dropdown', 'text_suggestions'].includes(param.datatype)) {
            param.options = config.lists[paramId] || [];
        }
    });

    return config;
}

function main() {
    const input      = process.argv[2] ? path.resolve(process.argv[2]) : path.resolve('metadata.xlsx');
    const yamlOutput = process.argv[3] ? path.resolve(process.argv[3]) : path.resolve('public', 'config', 'metadata.yaml');
    const tsOutput   = process.argv[4] ? path.resolve(process.argv[4]) : path.resolve('src', 'types', 'metadata.d.ts');
    console.log('input:      ', input);
    console.log('yamlOutput: ', yamlOutput);
    console.log('tsOutput:   ', tsOutput);
    const cfg        = generateConfig(input);

    fs.writeFileSync(yamlOutput, yaml.dump(cfg, { noRefs: true, lineWidth: 120 }), 'utf8');
    console.log(`✅ metadata.yaml written to ${yamlOutput}`);

    const tsDef = generateTs(cfg);
    fs.writeFileSync(tsOutput, tsDef, 'utf8');
    console.log(`✅ metadata.d.ts written to ${tsOutput}`);
}

main();
