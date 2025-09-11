import { describe, it, expect } from 'vitest';
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import yaml from 'js-yaml';

import Ajv2020 from 'ajv/dist/2020';
import addFormats from 'ajv-formats';


const REPO_ROOT = path.resolve(__dirname, '..', '..');
const PARSER = path.resolve(REPO_ROOT, 'src', 'node-utils', 'generate-config.js');
const SCHEMA_JSON = path.resolve(__dirname, 'metadata-generation.schema.json');
const FIXTURES_DIR = path.resolve(REPO_ROOT, 'tests', 'metadata-generation', 'fixtures');

const CASES: Array<{ name: string; xlsx: string; yaml: string }> = [
    {
        name: 'botek',
        xlsx: path.join(FIXTURES_DIR, 'botek.xlsx'),
        yaml: path.join(FIXTURES_DIR, 'botek.yaml'),
    },
    {
        name: 'cirp-ift',
        xlsx: path.join(FIXTURES_DIR, 'cirp-ift.xlsx'),
        yaml: path.join(FIXTURES_DIR, 'cirp-ift.yaml'),
    },
    {
        name: 'cirp-ptw',
        xlsx: path.join(FIXTURES_DIR, 'cirp-ptw.xlsx'),
        yaml: path.join(FIXTURES_DIR, 'cirp-ptw.yaml'),
    },
    {
        name: 'default-ift',
        xlsx: path.join(FIXTURES_DIR, 'default-ift.xlsx'),
        yaml: path.join(FIXTURES_DIR, 'default-ift.yaml'),
    }
];

function loadYaml(p: string) {
    return yaml.load(fs.readFileSync(p, 'utf-8'));
}

function stripGeneratedAt<T extends Record<string, any>>(obj: T): T {
    const clone = JSON.parse(JSON.stringify(obj));
    if (clone?.info) delete clone.info.generated_at;
    return clone;
}

describe('generate-config.js – fixture parity', () => {
    it.each(CASES.map((c) => [c.name, c] as const))(
        '%s: generator output matches fixture YAML and schema-valid',
        (_name, c) => {
            const tmpdir = fs.mkdtempSync(path.join(os.tmpdir(), 'meta-fixture-'));
            const outPath = path.join(tmpdir, 'metadata.yaml');

            execFileSync('node', [PARSER, c.xlsx, outPath], {
                cwd: REPO_ROOT,
                encoding: 'utf-8',
            });

            const expected = stripGeneratedAt(loadYaml(c.yaml) as Record<string, any>);
            const actual = stripGeneratedAt(loadYaml(outPath) as Record<string, any>);
            expect(actual).toEqual(expected);

            const schema = JSON.parse(fs.readFileSync(SCHEMA_JSON, 'utf-8'));

            const ajv = new Ajv2020({ allErrors: true, strict: false });
            addFormats(ajv);

            const validate = ajv.compile(schema);
            const valid = validate(loadYaml(outPath));
            if (!valid) {
                console.error(validate.errors);
            }
            expect(valid).toBe(true);
        }
    );
});
