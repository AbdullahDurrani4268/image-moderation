const API_URL = 'http://localhost:7000';
let currentToken = localStorage.getItem('token');
const ADMIN_TOKEN = 'admin-token-123'; // Default admin token

// Check if current token is admin
async function checkAdminStatus() {
    if (!currentToken) return;
    
    try {
        const response = await fetch(`${API_URL}/auth/tokens`, {
            headers: {
                'Authorization': `Bearer ${currentToken}`
            }
        });
        
        if (response.ok) {
            document.getElementById('adminSection').style.display = 'block';
        } else {
            document.getElementById('adminSection').style.display = 'none';
        }
    } catch (error) {
        console.error('Error checking admin status:', error);
        document.getElementById('adminSection').style.display = 'none';
    }
}

// Token management
async function createNewToken() {
    try {
        const response = await fetch(`${API_URL}/auth/tokens`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${currentToken}`
            }
        });
        
        if (!response.ok) {
            throw new Error('Failed to create token');
        }
        
        const data = await response.json();
        updateTokenStatus('New token created successfully', 'success');
        listTokens(); // Refresh token list
        return data.token;
    } catch (error) {
        console.error('Error creating token:', error);
        updateTokenStatus('Failed to create token. Please try again.', 'error');
        throw error;
    }
}

async function listTokens() {
    try {
        const response = await fetch(`${API_URL}/auth/tokens`, {
            headers: {
                'Authorization': `Bearer ${currentToken}`
            }
        });
        
        if (!response.ok) {
            throw new Error('Failed to list tokens');
        }
        
        const tokens = await response.json();
        displayTokens(tokens);
    } catch (error) {
        console.error('Error listing tokens:', error);
        updateTokenStatus('Failed to list tokens. Please try again.', 'error');
    }
}

async function deleteToken(token) {
    try {
        const response = await fetch(`${API_URL}/auth/tokens/${token}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${currentToken}`
            }
        });
        
        if (!response.ok) {
            throw new Error('Failed to delete token');
        }
        
        updateTokenStatus('Token deleted successfully', 'success');
        listTokens(); // Refresh token list
    } catch (error) {
        console.error('Error deleting token:', error);
        updateTokenStatus('Failed to delete token. Please try again.', 'error');
    }
}

function displayTokens(tokens) {
    const tokenList = document.getElementById('tokenList');
    tokenList.innerHTML = '';
    
    tokens.forEach(token => {
        const tokenItem = document.createElement('div');
        tokenItem.className = 'token-item';
        
        const date = new Date(token.createdAt);
        const formattedDate = date.toLocaleString();
        
        tokenItem.innerHTML = `
            <div class="token-info">
                <span class="token-value">${token.token}</span>
                <span class="token-date">Created: ${formattedDate}</span>
            </div>
            <div class="token-actions">
                <button onclick="deleteToken('${token.token}')" class="delete">Delete</button>
            </div>
        `;
        
        tokenList.appendChild(tokenItem);
    });
}

async function setToken() {
    const tokenInput = document.getElementById('tokenInput');
    const token = tokenInput.value.trim();
    
    if (token) {
        currentToken = token;
        localStorage.setItem('token', token);
        updateTokenStatus('Token set successfully', 'success');
        await checkAdminStatus();
    } else {
        try {
            // If no token provided, try to create a new one
            const newToken = await createNewToken();
            tokenInput.value = newToken;
            currentToken = newToken;
            localStorage.setItem('token', newToken);
            updateTokenStatus('New token created and set successfully', 'success');
            await checkAdminStatus();
        } catch (error) {
            updateTokenStatus('Failed to create new token. Please try again.', 'error');
        }
    }
}

function updateTokenStatus(message, type) {
    const statusDiv = document.getElementById('tokenStatus');
    statusDiv.textContent = message;
    statusDiv.className = type;
}

// File upload handling
const dropZone = document.getElementById('dropZone');
const fileInput = document.getElementById('fileInput');

dropZone.addEventListener('dragover', (e) => {
    e.preventDefault();
    dropZone.style.backgroundColor = '#e9ecef';
});

dropZone.addEventListener('dragleave', (e) => {
    e.preventDefault();
    dropZone.style.backgroundColor = '#f8f9fa';
});

dropZone.addEventListener('drop', (e) => {
    e.preventDefault();
    dropZone.style.backgroundColor = '#f8f9fa';
    const files = e.dataTransfer.files;
    if (files.length > 0) {
        handleFile(files[0]);
    }
});

fileInput.addEventListener('change', (e) => {
    if (e.target.files.length > 0) {
        handleFile(e.target.files[0]);
    }
});

async function handleFile(file) {
    if (!file.type.startsWith('image/')) {
        alert('Please upload an image file');
        return;
    }

    if (!currentToken) {
        try {
            const newToken = await createNewToken();
            document.getElementById('tokenInput').value = newToken;
            currentToken = newToken;
            localStorage.setItem('token', newToken);
            updateTokenStatus('New token created and set successfully', 'success');
            await checkAdminStatus();
        } catch (error) {
            alert('Please set a token first');
            return;
        }
    }

    // Preview image
    const preview = document.getElementById('preview');
    const img = document.createElement('img');
    img.src = URL.createObjectURL(file);
    preview.innerHTML = '';
    preview.appendChild(img);

    // Upload and moderate image
    const formData = new FormData();
    formData.append('file', file);

    try {
        const response = await fetch(`${API_URL}/moderate`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${currentToken}`
            },
            body: formData
        });

        if (!response.ok) {
            if (response.status === 401) {
                throw new Error('Invalid token. Please set a new token.');
            }
            throw new Error(`Server error: ${response.status}`);
        }

        const data = await response.json();
        displayResults(data);
    } catch (error) {
        console.error('Error:', error);
        alert(error.message || 'Error processing image. Please try again.');
    }
}

function displayResults(data) {
    const resultsDiv = document.getElementById('results');
    
    // Clear previous results
    resultsDiv.innerHTML = `
        <h3>Moderation Results</h3>
        <div class="result-status ${data.is_safe ? 'safe' : 'unsafe'}">
            ${data.is_safe ? '✅ Image is safe' : '❌ Image is unsafe'}
        </div>
        <div class="result-reason">
            ${data.reason}
        </div>
    `;

    // If there are errors in the analysis, display them
    if (data.analysis && data.analysis.errors) {
        const errorSection = document.createElement('div');
        errorSection.className = 'error-section';
        errorSection.innerHTML = `
            <h4>Analysis Errors</h4>
            <ul>
                ${data.analysis.errors.map(error => `<li>${error}</li>`).join('')}
            </ul>
        `;
        resultsDiv.appendChild(errorSection);
    }

    // Create sections for different types of analysis
    if (data.analysis) {
        // NSFW Analysis
        if (data.analysis.nsfw) {
            const nsfwSection = createSection('NSFW Analysis', [
                { label: 'Overall Score', value: (data.analysis.nsfw.score * 100).toFixed(2) + '%' },
                { label: 'Drawings', value: (data.analysis.nsfw.categories.drawings * 100).toFixed(2) + '%' },
                { label: 'Nude', value: (data.analysis.nsfw.categories.nude * 100).toFixed(2) + '%' },
            ]);
            resultsDiv.appendChild(nsfwSection);
        }

        // Content Moderation
        if (data.analysis.content) {
            const contentSection = createSection('Content Moderation', [
                { label: 'Violence', value: (data.analysis.content.violence * 100).toFixed(2) + '%' },
                { label: 'Hate Symbols', value: (data.analysis.content.hate_symbols * 100).toFixed(2) + '%' },
                { label: 'Self-harm', value: (data.analysis.content.self_harm * 100).toFixed(2) + '%' },
                { label: 'Extremist Content', value: (data.analysis.content.extremist * 100).toFixed(2) + '%' },
                { label: 'Faces Detected', value: data.analysis.content.faces_detected }
            ]);
            resultsDiv.appendChild(contentSection);
        }

        // Text Detection
        if (data.analysis.text) {
            const textSection = createSection('Text Detection', [
                { label: 'Detected Text', value: data.analysis.text.detected_text },
                { label: 'Confidence', value: (data.analysis.text.confidence * 100).toFixed(2) + '%' }
            ]);
            resultsDiv.appendChild(textSection);
        }
    }
}

function createSection(title, items) {
    const section = document.createElement('div');
    section.className = 'result-section';
    
    const sectionTitle = document.createElement('h4');
    sectionTitle.textContent = title;
    section.appendChild(sectionTitle);

    const table = document.createElement('table');
    table.className = 'result-table';

    const tbody = document.createElement('tbody');
    items.forEach(item => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${item.label}</td>
            <td>${item.value}</td>
        `;
        tbody.appendChild(row);
    });

    table.appendChild(tbody);
    section.appendChild(table);
    return section;
}

// Initialize
if (currentToken) {
    document.getElementById('tokenInput').value = currentToken;
    updateTokenStatus('Token loaded from storage', 'success');
    checkAdminStatus();
} 