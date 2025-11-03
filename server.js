const express = require('express');
const fs = require('fs');
const path = require('path');
const app = express();
const port = 80;

app.use(express.json());
app.use(express.static('public'));

// Get list of available exams
app.get('/exams', (req, res) => {
    const examsDir = path.join(__dirname, 'exams');
    if (!fs.existsSync(examsDir)) {
        return res.json([]);
    }
    const examFiles = fs.readdirSync(examsDir)
        .filter(file => file.endsWith('.json'))
        .map(file => file.replace('.json', ''));
    res.json(examFiles);
});

// Get questions for a specific exam
app.get('/questions/:examName', (req, res) => {
    const examName = req.params.examName;
    const fileName = `${examName}.json`;
    const filePath = path.join(__dirname, 'exams', fileName);

    if (!fs.existsSync(filePath)) {
        return res.status(404).send('Exam file not found.');
    }

    try {
        const questions = JSON.parse(fs.readFileSync(filePath, 'utf8'));
        // Shuffle options for each question to randomize
        const shuffledQuestions = questions.map(question => ({
            ...question,
            Options: [...question.Options].sort(() => Math.random() - 0.5)
        }));
        res.json(shuffledQuestions);
    } catch (error) {
        res.status(500).send('Error parsing exam file.');
    }
});

// Submit exam results
app.post('/submit', (req, res) => {
    const result = req.body;
    const resultFilePath = 'results.json';

    let results = [];
    if (fs.existsSync(resultFilePath)) {
        try {
            const fileContent = fs.readFileSync(resultFilePath, 'utf8');
            if (fileContent.trim()) {
                results = JSON.parse(fileContent);
            }
        } catch (error) {
            console.error('Error reading results file:', error);
        }
    }

    // Add timestamp to result
    result.timestamp = new Date().toISOString();
    results.push(result);

    try {
        fs.writeFileSync(resultFilePath, JSON.stringify(results, null, 2));
        res.send('Result saved successfully.');
    } catch (error) {
        console.error('Error saving results:', error);
        res.status(500).send('Error saving results.');
    }
});

// Serve images
app.use('/images', express.static('images'));

// Serve results file
app.use('/results.json', express.static('results.json'));

app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});
