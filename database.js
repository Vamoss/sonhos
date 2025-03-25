// This module previously handled saving data to vamoss.com.br
// Since the website is no longer available, the functionality has been removed

async function saveData(word1, word2, word3, phrase) {
  return new Promise((resolve) => {
    // Log the data locally instead of sending to server
    console.log('Data that would have been saved:', { word1, word2, word3, phrase });
    
    // Return a mock successful response
    resolve(JSON.stringify({ status: true, message: 'Data logged locally' }));
  });
}

module.exports = { saveData };