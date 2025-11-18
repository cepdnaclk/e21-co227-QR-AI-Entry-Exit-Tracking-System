// Import the Supabase client
const supabase = require('../config/database');

exports.getBuildings = async (req, res) => {
    try {
        // Query Supabase to get all buildings
        const { data, error } = await supabase
            .from('BUILDING')
            .select('*');
        
        // Check if Supabase returned an error
        if (error) {
            console.error('Error fetching buildings:', error);
            return res.status(500).json({ error: 'Failed to fetch buildings' });
        }
        // Send the buildings data as JSON response
        res.json(data);
    } catch (error) {
        // Catch any unexpected errors (network issues, etc.)
        console.error('Unexpected error fetching buildings:', error);
        res.status(500).json({ error: 'Failed to fetch buildings' });
    }
};

//Manually update building occupancy count
exports.updateCount = async (req, res) => {
    // Extract data from request body
    const { building_id, direction, count } = req.body;

    // Validate that all required fields are present
    if (!building_id || !direction || !count) {
        return res.status(400).json({ error: 'Missing required fields' });
    }

    try {
        // Fetch current count
        const { data: building, error: fetchError } = await supabase
            .from('BUILDING')
            .select('total_count')
            .eq('building_id', building_id)
            .single();
        
        // Check if building was found
        if (fetchError || !building) {
            console.error('Error fetching building:', fetchError);
            return res.status(404).json({ error: 'Building not found' });
        }

        // Calculate new count based on direction
        let newCount = building.total_count;
        if (direction === 'IN') {
            newCount += count;
        } else if (direction === 'OUT') {
            newCount = Math.max(0, newCount - count);
        } else {
            return res.status(400).json({ error: 'Invalid direction' });
        }

        // Update count
        const { error: updateError } = await supabase
            .from('BUILDING')
            .update({ total_count: newCount })
            .eq('building_id', building_id);

        // Check if update was successful
        if (updateError) {
            console.error('Error updating count:', updateError);
            return res.status(500).json({ error: 'Failed to update count' });
        }

        // Send success response with details
        res.json({
            message: `Successfully updated count for building ${building_id} (${direction} by ${count})`,
            building: { building_id, total_count: newCount }
        });
    } catch (error) {
        console.error('Unexpected error updating count:', error);
        res.status(500).json({ error: 'Failed to update count' });
    }
};