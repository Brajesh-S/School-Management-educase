// Import the database configuration
const db = require('../config/db');

// Validation function for school data
function validateSchoolInput(name, address, latitude, longitude) {
    if (!name || typeof name !== 'string' || name.trim() === '') {
        return 'Name is required and must be a non-empty string.';
    }
    if (!address || typeof address !== 'string' || address.trim() === '') {
        return 'Address is required and must be a non-empty string.';
    }
    if (latitude == null || typeof latitude !== 'number') {
        return 'Latitude is required and must be a number.';
    }
    if (longitude == null || typeof longitude !== 'number') {
        return 'Longitude is required and must be a number.';
    }
    return null;
}

// Add School API Controller
exports.addSchool = (req, res) => {
    const { name, address, latitude, longitude } = req.body;

    // Validate input
    const validationError = validateSchoolInput(name, address, latitude, longitude);
    if (validationError) {
        return res.status(400).json({ message: validationError });
    }

    // Insert the new school (the unique constraint on latitude and longitude will prevent duplicates)
    const insertSql = 'INSERT INTO schools (name, address, latitude, longitude) VALUES (?, ?, ?, ?)';
    db.query(insertSql, [name, address, latitude, longitude], (err, result) => {
        if (err) {
            // Check if the error is a duplicate entry error
            if (err.code === 'ER_DUP_ENTRY') {
                return res.status(400).json({ message: 'A school with the same latitude and longitude already exists.' });
            }
            console.error(err);
            return res.status(500).json({ message: 'Database error' });
        }
        res.status(201).json({ message: 'School added successfully', schoolId: result.insertId });
    });
};

// List Schools API Controller
exports.listSchools = (req, res) => {
    const { latitude, longitude } = req.body; // Extract latitude and longitude from the request body

    // Validate latitude and longitude presence
    if (latitude == null || longitude == null) {
        return res.status(400).json({ message: 'Latitude and Longitude are required.' });
    }

    const userLat = parseFloat(latitude);
    const userLon = parseFloat(longitude);

    // Validate latitude and longitude are numbers
    if (isNaN(userLat) || isNaN(userLon)) {
        return res.status(400).json({ message: 'Latitude and Longitude must be valid numbers.' });
    }

    const sql = 'SELECT * FROM schools';
    db.query(sql, (err, results) => {
        if (err) {
            console.error(err);
            return res.status(500).json({ message: 'Database error' });
        }

        // Calculate distance from the user for each school and round off
        results.forEach(school => {
            const schoolLat = school.latitude;
            const schoolLon = school.longitude;
            let distance = haversineDistance(userLat, userLon, schoolLat, schoolLon);
            distance = Math.round(distance); // Round off to the nearest integer
            school.distance = `${distance} km`; // Append 'km' to the distance
        });

        // Sort schools by distance from user location
        results.sort((a, b) => parseInt(a.distance) - parseInt(b.distance));

        res.json(results);
    });
};

// Haversine distance calculation
function haversineDistance(lat1, lon1, lat2, lon2) {
    const toRad = x => (x * Math.PI) / 180;

    const R = 6371; // Radius of the Earth in km
    const dLat = toRad(lat2 - lat1);
    const dLon = toRad(lon2 - lon1);
    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const d = R * c; // Distance in km

    return d;
}
