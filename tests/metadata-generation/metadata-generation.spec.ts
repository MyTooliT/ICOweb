import { describe, it, expect } from 'vitest';
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import yaml from 'js-yaml';
import Ajv2020 from 'ajv/dist/2020';
import addFormats from 'ajv-formats';

const REPO_ROOT = path.resolve(__dirname, '..', '..');
const INPUT_XLSX = path.resolve(REPO_ROOT, 'metadata.xlsx');
const PARSER = path.resolve(REPO_ROOT, 'src', 'node-utils', 'generate-config.js');
const CANON_YAML = path.resolve(REPO_ROOT, 'public', 'config', 'metadata.yaml');
const SCHEMA_JSON = path.resolve(__dirname, 'metadata-generation.schema.json');


function loadYaml(p: string) {
    return yaml.load(fs.readFileSync(p, 'utf-8'));
}

function stripGeneratedAt(obj: any) {
    const clone = structuredClone(obj);
    if (clone?.info) {
        delete clone.info.generated_at;
    }
    return clone;
}

describe('metadata-generation.xlsx → YAML generator', () => {
    it('re-generates the same YAML (ignoring generated_at)', () => {
        const tmpdir = fs.mkdtempSync(path.join(os.tmpdir(), 'meta-'));
        const outPath = path.join(tmpdir, 'metadata-generation.yaml');

        // Run the generator
        execFileSync('node', [PARSER, INPUT_XLSX, outPath], {
            cwd: REPO_ROOT,
            encoding: 'utf-8',
        });

        const expected = stripGeneratedAt(loadYaml(CANON_YAML));
        const actual = stripGeneratedAt(loadYaml(outPath));

        expect(actual).toEqual(expected);
    });

    it('validates the YAML against JSON Schema (Ajv)', () => {
        const ajv = new Ajv2020({ allErrors: true, strict: false });
        addFormats(ajv);
        const schema = JSON.parse(fs.readFileSync(SCHEMA_JSON, 'utf-8'));
        const validate = ajv.compile(schema);

        const doc = loadYaml(CANON_YAML);
        const valid = validate(doc);

        if (!valid) {
            console.error(validate.errors);
        }
        expect(valid).toBe(true);
    });
});
