document.addEventListener('DOMContentLoaded', function() {
    const schemaNameInput = document.getElementById('schemaName');
    const createButton = document.getElementById('createButton');
    const loadingMessage = document.getElementById('loadingMessage');
    const loadingText = document.getElementById('loadingText');
    const schemasList = document.getElementById('schemasList');

    // 초기 목록 로드
    loadSchemas();

    createButton.addEventListener('click', handleCreate);

    async function handleCreate() {
        const schemaName = schemaNameInput.value.trim();
        if (!schemaName) {
            alert('Please enter a schema name');
            return;
        }

        if (createButton.disabled) return;

        createButton.disabled = true;
        loadingMessage.classList.remove('hidden');
        schemaNameInput.disabled = true;

        try {
            const eventSource = new EventSource(`/progress`);
            
            eventSource.onmessage = function(event) {
                const data = JSON.parse(event.data);
                loadingText.textContent = data.message;
            };

            const response = await fetch('/schemas', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ schemaName })
            });

            eventSource.close();
            
            const data = await response.json();
            
            if (data.success) {
                schemaNameInput.value = '';
                await loadSchemas();
                alert('Schema created successfully!');
            } else {
                alert('Failed to create schema: ' + data.error);
            }
        } catch (error) {
            alert('An error occurred: ' + error.message);
        } finally {
            createButton.disabled = false;
            loadingMessage.classList.add('hidden');
            schemaNameInput.disabled = false;
            loadingText.textContent = 'Preparing to create schema...';
        }
    }

    async function loadSchemas() {
        try {
            const response = await fetch('/schemas');
            const data = await response.json();
            
            if (data.success) {
                if (data.schemas.length === 0) {
                    schemasList.innerHTML = `
                        <div class="schema-item">
                            <span>No schemas created yet</span>
                        </div>
                    `;
                } else {
                    schemasList.innerHTML = data.schemas.map(schema => `
                        <div class="schema-item">
                            <span class="schema-name">${schema.name}</span>
                            <input type="text" class="url-input" value="${schema.url}" readonly>
                            <button class="copy-btn" data-url="${schema.url}">Copy</button>
                            <a href="${schema.url}" target="_blank" class="open-btn">Open</a>
                            <button class="delete-btn" data-name="${schema.name}">Delete</button>
                        </div>
                    `).join('');

                    attachDeleteListeners();
                    attachCopyListeners();
                }
            }
        } catch (error) {
            console.error('Failed to load schemas:', error);
            schemasList.innerHTML = `
                <div class="schema-item">
                    <span>Failed to load schema list</span>
                </div>
            `;
        }
    }

    function attachDeleteListeners() {
        document.querySelectorAll('.delete-btn').forEach(button => {
            button.addEventListener('click', async function() {
                const schemaName = this.dataset.name;
                if (confirm(`Are you sure you want to delete "${schemaName}"?`)) {
                    try {
                        const response = await fetch(`/schemas/${schemaName}`, {
                            method: 'DELETE'
                        });
                        const data = await response.json();
                        if (data.success) {
                            await loadSchemas();
                        } else {
                            alert('Failed to delete: ' + data.error);
                        }
                    } catch (error) {
                        alert('Error while deleting: ' + error.message);
                    }
                }
            });
        });
    }

    function attachCopyListeners() {
        document.querySelectorAll('.copy-btn').forEach(button => {
            button.addEventListener('click', function() {
                const url = this.dataset.url;
                navigator.clipboard.writeText(url).then(() => {
                    // 복사 성공 표시
                    const originalText = this.textContent;
                    this.textContent = 'Copied!';
                    setTimeout(() => {
                        this.textContent = originalText;
                    }, 1000);
                });
            });
        });
    }
});
