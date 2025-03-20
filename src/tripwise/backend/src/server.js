const express = require('express');
const cors = require('cors');
const GeminiRoutes = require('./routes/GeminiRoutes');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

app.use('/api', GeminiRoutes);

app.get('/', (req, res) => {
    res.send('TripWise Backend Running');
});

const PORT = process.env.PORT || 5001;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
