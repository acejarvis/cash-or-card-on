const { pool } = require('./src/config/database');
const paymentMethodDAO = require('./src/dao/paymentMethodDAO');

async function testProposal() {
    try {
        console.log('Starting verification...');

        // 1. Get a restaurant
        const res = await pool.query('SELECT id FROM restaurants LIMIT 1');
        const restaurantId = res.rows[0].id;
        console.log('Restaurant ID:', restaurantId);

        // 2. Ensure a verified 'visa' exists
        await pool.query("DELETE FROM payment_methods WHERE restaurant_id = $1 AND payment_type = 'visa'", [restaurantId]);
        await pool.query(`
      INSERT INTO payment_methods (restaurant_id, payment_type, is_accepted, is_verified, upvotes)
      VALUES ($1, 'visa', true, true, 10)
    `, [restaurantId]);
        console.log('Created verified Visa.');

        // 3. Submit proposal to change 'visa' to NOT accepted
        // This should create a NEW unverified row
        const proposal = await paymentMethodDAO.upsert(restaurantId, 'visa', false, null);
        console.log('Proposal created:', proposal.id, 'Verified:', proposal.is_verified, 'Accepted:', proposal.is_accepted);

        if (proposal.is_verified) throw new Error('Proposal should be unverified');
        if (proposal.is_accepted) throw new Error('Proposal should be NOT accepted');

        // 4. Verify both exist
        const all = await pool.query("SELECT * FROM payment_methods WHERE restaurant_id = $1 AND payment_type = 'visa'", [restaurantId]);
        console.log('Total rows for Visa:', all.rows.length);
        if (all.rows.length !== 2) throw new Error('Should have 2 rows (1 verified, 1 pending)');

        // 5. Verify the proposal (Admin action)
        // We need a dummy admin ID, or just pass null if DAO allows (it uses it for verified_by)
        const adminId = null;
        const verified = await paymentMethodDAO.verify(proposal.id, adminId);
        console.log('Verified proposal:', verified.id, 'Verified:', verified.is_verified);

        // 6. Check that old one is gone
        const final = await pool.query("SELECT * FROM payment_methods WHERE restaurant_id = $1 AND payment_type = 'visa'", [restaurantId]);
        console.log('Final rows for Visa:', final.rows.length);
        if (final.rows.length !== 1) throw new Error('Should have 1 row after verification');
        if (final.rows[0].id !== proposal.id) throw new Error('Remaining row should be the proposal');
        if (final.rows[0].is_accepted) throw new Error('Remaining row should be NOT accepted');

        console.log('SUCCESS: Proposal workflow verified.');
    } catch (e) {
        console.error('FAILED:', e);
    } finally {
        await pool.end();
    }
}

testProposal();
