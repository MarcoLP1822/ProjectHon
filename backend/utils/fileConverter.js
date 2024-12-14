const textract = require('textract');
const fs = require('fs').promises;

const convertToTxt = async (filePath) => {
    try {
        console.log('Attempting to extract text from:', filePath);
        
        const config = {
            preserveLineBreaks: true,
            preserveOnlyMultipleLineBreaks: true,
        };

        const text = await new Promise((resolve, reject) => {
            textract.fromFileWithPath(filePath, config, (error, text) => {
                if (error) {
                    console.error('Textract error:', error);
                    reject(error);
                }
                else resolve(text);
            });
        });

        if (!text || text.trim().length === 0) {
            throw new Error('Extracted text is empty');
        }

        console.log(`Text extracted successfully, length: ${text.length}`);
        console.log('First 100 chars:', text.substring(0, 100));

        return {
            success: true,
            text: text.trim()
        };
    } catch (error) {
        console.error('Error during text extraction:', error);
        return {
            success: false,
            error: error.message
        };
    }
};

module.exports = {
    convertToTxt
}; 