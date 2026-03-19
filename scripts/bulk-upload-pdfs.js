#!/usr/bin/env node

/**
 * Bulk PDF Upload Script for Royaltyportaal
 *
 * Usage:
 *   node scripts/bulk-upload-pdfs.js ./pdfs-map --prefix-royalty=RA --prefix-subsidiary=NR --prefix-foreign=FR
 *
 * Environment variables (via .env in scripts/ directory):
 *   SUPABASE_URL - Supabase project URL
 *   SUPABASE_SERVICE_ROLE_KEY - Service role key (admin access)
 *
 * Filename format: PREFIX_xxxxxxx_Voorletters_Achternaam_YYYYMM.pdf
 *   - PREFIX determines payment type (configurable via --prefix-* flags)
 *   - xxxxxxx is the netsuite_internal_id (5-9 digits)
 *   - YYYYMM is year and month
 */

import { createClient } from '@supabase/supabase-js';
import { readFileSync, readdirSync, statSync } from 'fs';
import { join, resolve } from 'path';
import { config } from 'dotenv';

// Load .env from scripts directory
config({ path: new URL('./.env', import.meta.url).pathname });

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY. Create a .env file in the scripts/ directory.');
    process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

// Parse CLI arguments
const args = process.argv.slice(2);
const pdfDir = args.find(a => !a.startsWith('--'));

if (!pdfDir) {
    console.error('Usage: node bulk-upload-pdfs.js <pdf-directory> [--prefix-royalty=RA] [--prefix-subsidiary=NR] [--prefix-foreign=FR]');
    process.exit(1);
}

const getFlag = (name, defaultValue) => {
    const flag = args.find(a => a.startsWith(`--${name}=`));
    return flag ? flag.split('=')[1].toUpperCase() : defaultValue;
};

const prefixMap = {
    [getFlag('prefix-royalty', 'RA')]: 'royalty',
    [getFlag('prefix-subsidiary', 'NR')]: 'subsidiary',
    [getFlag('prefix-foreign', 'FR')]: 'foreign',
};

const typeNames = { royalty: 'Royalty-afrekening', subsidiary: 'Nevenrechten', foreign: 'Foreign Rights' };
const typeNamesEn = { royalty: 'Royalty Statement', subsidiary: 'Reader Rights', foreign: 'Foreign Rights' };
const months = { royalty: { nl: '15 maart', en: 'March 15' }, subsidiary: { nl: '15 juni', en: 'June 15' }, foreign: { nl: '15 juli', en: 'July 15' } };
const sortMonths = { royalty: '03-15', subsidiary: '06-15', foreign: '07-15' };

function parseFilename(filename) {
    const name = filename.replace(/\.pdf$/i, '');
    const parts = name.split('_');
    if (parts.length < 3) return null;

    const prefix = parts[0].toUpperCase();
    const type = prefixMap[prefix] || null;

    let internalId = null;
    for (let i = 1; i < parts.length; i++) {
        if (/^\d{5,9}$/.test(parts[i])) {
            internalId = parts[i];
            break;
        }
    }

    let year = null;
    const lastPart = parts[parts.length - 1];
    const dateMatch = lastPart.match(/^(\d{4})(\d{2})$/);
    if (dateMatch) {
        year = parseInt(dateMatch[1]);
    }

    return { type, internalId, year };
}

async function main() {
    const resolvedDir = resolve(pdfDir);
    console.log(`\nScanning directory: ${resolvedDir}`);
    console.log(`Prefix mapping: ${JSON.stringify(Object.fromEntries(Object.entries(prefixMap).map(([k, v]) => [k, v])))}\n`);

    // List PDF files
    let files;
    try {
        files = readdirSync(resolvedDir).filter(f => f.toLowerCase().endsWith('.pdf'));
    } catch (err) {
        console.error(`Cannot read directory: ${err.message}`);
        process.exit(1);
    }

    if (files.length === 0) {
        console.log('No PDF files found.');
        process.exit(0);
    }

    console.log(`Found ${files.length} PDF files\n`);

    // Load authors and build lookup
    const { data: authors, error: authorsError } = await supabase
        .from('authors')
        .select('id, email, first_name, last_name, netsuite_internal_id')
        .eq('is_admin', false);

    if (authorsError) {
        console.error('Error fetching authors:', authorsError.message);
        process.exit(1);
    }

    const authorLookup = {};
    authors.forEach(a => {
        if (a.netsuite_internal_id) {
            authorLookup[a.netsuite_internal_id.toString()] = a;
        }
    });

    console.log(`Loaded ${authors.length} authors (${Object.keys(authorLookup).length} with internal IDs)\n`);

    let uploaded = 0, skipped = 0, failed = 0;
    const errors = [];

    for (const filename of files) {
        const parsed = parseFilename(filename);
        const author = parsed?.internalId ? authorLookup[parsed.internalId] : null;

        if (!parsed?.type || !author || !parsed?.year) {
            const reason = !parsed?.type ? 'unknown prefix' : !author ? `author ${parsed?.internalId} not found` : 'no year';
            console.log(`  SKIP  ${filename} (${reason})`);
            skipped++;
            continue;
        }

        try {
            const filePath = `${author.id}/${parsed.type}/${parsed.year}/${filename}`;
            const fileBuffer = readFileSync(join(resolvedDir, filename));

            // Upload to Storage
            const { error: uploadError } = await supabase.storage
                .from('statements')
                .upload(filePath, fileBuffer, {
                    contentType: 'application/pdf',
                    upsert: true,
                });
            if (uploadError) throw uploadError;

            // Create payment record
            const { error: dbError } = await supabase.from('payments').insert({
                author_id: author.id,
                type: parsed.type,
                year: parsed.year,
                amount: 0,
                filename,
                title_nl: `${typeNames[parsed.type]} ${parsed.year}`,
                title_en: `${typeNamesEn[parsed.type]} ${parsed.year}`,
                date_nl: `${months[parsed.type].nl} ${parsed.year + 1}`,
                date_en: `${months[parsed.type].en}, ${parsed.year + 1}`,
                sort_date: `${parsed.year + 1}-${sortMonths[parsed.type]}`,
                file_path: filePath,
            });
            if (dbError) throw dbError;

            console.log(`  OK    ${filename} → ${author.first_name} ${author.last_name}`);
            uploaded++;
        } catch (err) {
            console.log(`  FAIL  ${filename}: ${err.message}`);
            errors.push({ file: filename, error: err.message });
            failed++;
        }
    }

    console.log(`\n${'='.repeat(50)}`);
    console.log(`Results:`);
    console.log(`  Uploaded:  ${uploaded}`);
    console.log(`  Skipped:   ${skipped}`);
    console.log(`  Failed:    ${failed}`);
    console.log(`${'='.repeat(50)}\n`);

    if (errors.length > 0) {
        console.log('Errors:');
        errors.forEach(e => console.log(`  - ${e.file}: ${e.error}`));
    }
}

main().catch(err => {
    console.error('Fatal error:', err);
    process.exit(1);
});
