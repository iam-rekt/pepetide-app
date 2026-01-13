/**
 * Storacha/IPFS Connection Test Script
 * Run with: npx tsx scripts/test-storacha.ts
 */

import * as Client from '@storacha/client';
import { StoreMemory } from '@storacha/client/stores/memory';
import * as Proof from '@storacha/client/proof';
import { Signer } from '@storacha/client/principal/ed25519';

async function testStoracha() {
    console.log('🧪 Testing Storacha Configuration...\n');

    const STORACHA_KEY = process.env.STORACHA_KEY;
    const STORACHA_PROOF = process.env.STORACHA_PROOF;

    // Step 1: Check environment variables
    console.log('Step 1: Checking environment variables...');
    if (!STORACHA_KEY) {
        console.error('❌ STORACHA_KEY is not set in environment');
        process.exit(1);
    }
    console.log('✅ STORACHA_KEY is set');
    console.log(`   Key starts with: ${STORACHA_KEY.substring(0, 20)}...`);

    if (!STORACHA_PROOF) {
        console.error('❌ STORACHA_PROOF is not set in environment');
        process.exit(1);
    }
    console.log('✅ STORACHA_PROOF is set');
    console.log(`   Proof starts with: ${STORACHA_PROOF.substring(0, 20)}...`);

    // Step 2: Parse the private key
    console.log('\nStep 2: Parsing private key...');
    let principal;
    try {
        principal = Signer.parse(STORACHA_KEY);
        console.log('✅ Private key parsed successfully');
        console.log(`   DID: ${principal.did()}`);
    } catch (error) {
        console.error('❌ Failed to parse private key:', error);
        process.exit(1);
    }

    // Step 3: Create client
    console.log('\nStep 3: Creating Storacha client...');
    let client;
    try {
        const store = new StoreMemory();
        client = await Client.create({ principal, store });
        console.log('✅ Client created successfully');
    } catch (error) {
        console.error('❌ Failed to create client:', error);
        process.exit(1);
    }

    // Step 4: Parse delegation proof
    console.log('\nStep 4: Parsing delegation proof...');
    let proof;
    try {
        proof = await Proof.parse(STORACHA_PROOF);
        console.log('✅ Delegation proof parsed successfully');
    } catch (error) {
        console.error('❌ Failed to parse delegation proof:', error);
        console.error('   This usually means the STORACHA_PROOF value is invalid.');
        console.error('   Make sure you used: storacha delegation create <did> --base64');
        process.exit(1);
    }

    // Step 5: Add space and set as current
    console.log('\nStep 5: Adding space from proof...');
    let space;
    try {
        space = await client.addSpace(proof);
        await client.setCurrentSpace(space.did());
        console.log('✅ Space added and set as current');
        console.log(`   Space DID: ${space.did()}`);
    } catch (error) {
        console.error('❌ Failed to add space:', error);
        console.error('   This usually means:');
        console.error('   1. The delegation was created for a different key');
        console.error('   2. The delegation has expired');
        console.error('   3. The delegation was revoked');
        process.exit(1);
    }

    // Step 6: Test upload with a small file
    console.log('\nStep 6: Testing file upload...');
    try {
        const testContent = `Test file created at ${new Date().toISOString()}`;
        const testFile = new File([testContent], 'test.txt', { type: 'text/plain' });

        const cid = await client.uploadFile(testFile);
        console.log('✅ Test file uploaded successfully!');
        console.log(`   CID: ${cid}`);
        console.log(`   Gateway URL: https://w3s.link/ipfs/${cid}`);
        console.log(`   Alternative: https://ipfs.io/ipfs/${cid}`);

        console.log('\n🎉 All tests passed! Storacha is configured correctly.');
        console.log('\n📝 Note: The uploaded file should appear in your Storacha dashboard');
        console.log('   at https://console.storacha.network/');
    } catch (error) {
        console.error('❌ Failed to upload test file:', error);
        console.error('   Error details:', (error as Error).message);
        process.exit(1);
    }
}

testStoracha().catch(console.error);
