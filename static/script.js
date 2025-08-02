document.addEventListener('DOMContentLoaded', function() {
    // Elements
    const uploadArea = document.getElementById('uploadArea');
    const fileInput = document.getElementById('fileInput');
    const headerUploadBtn = document.getElementById('headerUploadBtn');
    const editorSection = document.getElementById('editorSection');
    const markdownEditor = document.getElementById('markdownEditor');
    const preview = document.getElementById('preview');
    const titleInput = document.getElementById('titleInput');
    const tagsInput = document.getElementById('tagsInput');
    const publishStatus = document.getElementById('publishStatus');
    const publishBtn = document.getElementById('publishBtn');
    const saveDraftBtn = document.getElementById('saveDraftBtn');
    const historyBtn = document.getElementById('historyBtn');
    const historyOverlay = document.getElementById('historyOverlay');
    const historyContent = document.getElementById('historyContent');
    const closeHistoryModal = document.getElementById('closeHistoryModal');
    const editorContainer = document.getElementById('editorContainer');
    const editorPanel = document.getElementById('editorPanel');
    const previewPanel = document.getElementById('previewPanel');
    const resizeHandle = document.getElementById('resizeHandle');
    const notification = document.getElementById('notification');
    
    // Resizable panels
    // Draft management
    let currentArticleId = null;
    let lastSavedContent = '';

    // File upload
    uploadArea.addEventListener('click', () => {
        fileInput.click();
    });

    uploadArea.addEventListener('dragover', (e) => {
        e.preventDefault();
        uploadArea.classList.add('dragover');
    });

    uploadArea.addEventListener('dragleave', () => {
        uploadArea.classList.remove('dragover');
    });

    uploadArea.addEventListener('drop', (e) => {
        e.preventDefault();
        uploadArea.classList.remove('dragover');
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

    // Header upload button
    headerUploadBtn.addEventListener('click', () => {
        fileInput.click();
    });

    // Markdown preview with auto-scroll sync
    markdownEditor.addEventListener('input', updatePreview);
    markdownEditor.addEventListener('scroll', syncPreviewScroll);
    markdownEditor.addEventListener('keyup', syncPreviewScroll);
    markdownEditor.addEventListener('click', syncPreviewScroll);

    // Publish and save draft buttons
    publishBtn.addEventListener('click', publishArticleLocal);
    saveDraftBtn.addEventListener('click', saveDraft);

    // History modal
    historyBtn.addEventListener('click', () => {
        historyOverlay.classList.add('show');
        loadHistory();
    });

    closeHistoryModal.addEventListener('click', () => {
        historyOverlay.classList.remove('show');
    });

    // Close modal when clicking outside
    historyOverlay.addEventListener('click', (e) => {
        if (e.target === historyOverlay) {
            historyOverlay.classList.remove('show');
        }
    });

    // Close modal with Escape key
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && historyOverlay.classList.contains('show')) {
            historyOverlay.classList.remove('show');
        }
    });

    // Resizable panels functionality
    let isResizing = false;
    let startX, startWidth;
    let isLoadingFile = false;

    resizeHandle.addEventListener('mousedown', (e) => {
        isResizing = true;
        startX = e.clientX;
        startWidth = editorPanel.offsetWidth;
        
        editorContainer.classList.add('resizing');
        document.body.style.cursor = 'col-resize';
        document.body.style.userSelect = 'none';
        
        e.preventDefault();
    });

    document.addEventListener('mousemove', (e) => {
        if (!isResizing) return;
        
        const deltaX = e.clientX - startX;
        const containerWidth = editorContainer.offsetWidth;
        const handleWidth = 6;
        const minPanelWidth = 250;
        const maxEditorWidth = containerWidth - minPanelWidth - handleWidth;
        
        const newWidth = Math.max(minPanelWidth, Math.min(startWidth + deltaX, maxEditorWidth));
        const previewWidth = containerWidth - newWidth - handleWidth;
        const finalEditorWidth = previewWidth >= minPanelWidth ? newWidth : containerWidth - minPanelWidth - handleWidth;
        
        editorPanel.style.flexBasis = `${finalEditorWidth}px`;
        previewPanel.style.flexBasis = `${containerWidth - finalEditorWidth - handleWidth}px`;
        
        e.preventDefault();
        e.stopPropagation();
    });

    document.addEventListener('mouseup', () => {
        if (isResizing) {
            isResizing = false;
            editorContainer.classList.remove('resizing');
            document.body.style.cursor = '';
            document.body.style.userSelect = '';
        }
    });

    function resetToUploadState() {
        // Show upload area and hide editor
        uploadArea.parentElement.style.display = 'block';
        headerUploadBtn.style.display = 'none';
        editorSection.style.display = 'none';
        
        // Clear all inputs
        markdownEditor.value = '';
        titleInput.value = '';
        tagsInput.value = '';
        preview.innerHTML = '';
        
        // Reset state
        currentArticleId = null;
        lastSavedContent = '';
        
        showNotification('Ready for new file upload', 'info');
    }

    // Functions
    function handleFile(file) {
        if (!file.name.endsWith('.md')) {
            showNotification('Please select a markdown (.md) file', 'error');
            return;
        }

        isLoadingFile = true;

        const reader = new FileReader();
        reader.onload = function(e) {
            const content = e.target.result;
            markdownEditor.value = content;
            
            markdownEditor.selectionStart = 0;
            markdownEditor.selectionEnd = 0;
            
            const lines = content.split('\n');
            for (let line of lines) {
                if (line.startsWith('# ')) {
                    titleInput.value = line.substring(2).trim();
                    break;
                }
            }
            
            updatePreview();
            
            setTimeout(() => {
                markdownEditor.scrollTop = 0;
                preview.scrollTop = 0;
                isLoadingFile = false;
                createInitialDraft(content);
            }, 100);
            
            editorSection.style.display = 'block';
            showNotification('File loaded successfully!', 'success');
            
            // Hide upload area and show header upload button
            uploadArea.parentElement.style.display = 'none';
            headerUploadBtn.style.display = 'inline-flex';
            
            currentArticleId = null;
            lastSavedContent = '';
        };
        reader.readAsText(file);
    }

    async function createInitialDraft(content) {
        const title = titleInput.value.trim();
        const tags = tagsInput.value.trim();
        const status = publishStatus.value;

        try {
            const formData = new FormData();
            formData.append('title', title);
            formData.append('content', content);
            formData.append('tags', tags);
            formData.append('publish_status', status);

            const response = await fetch('/save-draft', {
                method: 'POST',
                body: formData
            });

            const result = await response.json();

            if (response.ok) {
                currentArticleId = result.article_id;
                lastSavedContent = content;
                showNotification('Draft created automatically', 'success');
            } else {
                console.error('Failed to create draft:', result);
            }
        } catch (error) {
            console.error('Failed to create initial draft:', error);
        }
    }

    function updatePreview() {
        const markdown = markdownEditor.value;
        const html = marked.parse(markdown);
        preview.innerHTML = html;
        
        if (!isLoadingFile) {
            setTimeout(syncPreviewScroll, 50);
        }
    }

    function syncPreviewScroll() {
        const editorHeight = markdownEditor.scrollHeight;
        const editorScrollTop = markdownEditor.scrollTop;
        const editorVisibleHeight = markdownEditor.clientHeight;
        
        const cursorPosition = markdownEditor.selectionStart;
        const textBeforeCursor = markdownEditor.value.substring(0, cursorPosition);
        const lineNumber = textBeforeCursor.split('\n').length - 1;
        const totalLines = markdownEditor.value.split('\n').length;
        
        let scrollRatio;
        
        if (totalLines <= 1) {
            scrollRatio = 0;
        } else {
            const lineRatio = lineNumber / (totalLines - 1);
            const scrollRatio_byScroll = editorScrollTop / (editorHeight - editorVisibleHeight || 1);
            scrollRatio = lineRatio * 0.8 + scrollRatio_byScroll * 0.2;
            scrollRatio = Math.max(0, Math.min(1, scrollRatio));
        }
        
        const previewMaxScroll = preview.scrollHeight - preview.clientHeight;
        const targetScrollTop = scrollRatio * previewMaxScroll;
        
        const currentScroll = preview.scrollTop;
        const scrollDiff = targetScrollTop - currentScroll;
        
        if (Math.abs(scrollDiff) > 5) {
            preview.scrollTo({
                top: targetScrollTop,
                behavior: 'smooth'
            });
        }
    }

    async function saveDraft() {
        const title = titleInput.value.trim();
        const content = markdownEditor.value.trim();
        const tags = tagsInput.value.trim();
        const status = publishStatus.value;

        if (!content) {
            showNotification('Please enter some content to save as draft', 'error');
            return;
        }

        if (!currentArticleId) {
            showNotification('No draft found. Please upload a file first.', 'error');
            return;
        }

        saveDraftBtn.disabled = true;
        saveDraftBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Saving...';

        try {
            const formData = new FormData();
            formData.append('title', title);
            formData.append('content', content);
            formData.append('tags', tags);
            formData.append('publish_status', status);
            formData.append('article_id', currentArticleId);

            const response = await fetch('/save-draft', {
                method: 'POST',
                body: formData
            });

            const result = await response.json();

            if (response.ok) {
                lastSavedContent = content;
                showNotification('Draft updated successfully', 'success');
            } else {
                showNotification(result.detail || 'Failed to save draft', 'error');
            }
        } catch (error) {
            showNotification('Error saving draft: ' + error.message, 'error');
        } finally {
            saveDraftBtn.disabled = false;
            saveDraftBtn.innerHTML = '<i class="fas fa-save"></i> Save Draft';
        }
    }

    async function publishArticleLocal() {
        const title = titleInput.value.trim();
        const content = markdownEditor.value.trim();
        const tags = tagsInput.value.trim();
        const status = publishStatus.value;

        if (!title) {
            showNotification('Please enter an article title', 'error');
            return;
        }

        if (!content) {
            showNotification('Please enter article content', 'error');
            return;
        }

        publishBtn.disabled = true;
        publishBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Publishing...';

        try {
            const formData = new FormData();
            formData.append('title', title);
            formData.append('content', content);
            formData.append('tags', tags);
            formData.append('publish_status', status);
            if (currentArticleId) {
                formData.append('article_id', currentArticleId);
            }

            const response = await fetch('/publish', {
                method: 'POST',
                body: formData
            });

            const result = await response.json();

            if (response.ok) {
                showNotification('Article published successfully to Medium!', 'success');
                titleInput.value = '';
                markdownEditor.value = '';
                tagsInput.value = '';
                currentArticleId = null;
                lastSavedContent = '';
                updatePreview();
            } else {
                showNotification(result.detail || 'Failed to publish article', 'error');
            }
        } catch (error) {
            showNotification('Error publishing article: ' + error.message, 'error');
        } finally {
            publishBtn.disabled = false;
            publishBtn.innerHTML = '<i class="fas fa-paper-plane"></i> Publish to Medium';
        }
    }

    async function loadHistory() {
        historyContent.innerHTML = '<p>Loading history...</p>';

        try {
            const response = await fetch('/history');
            const result = await response.json();

            if (response.ok && result.articles.length > 0) {
                let html = '';
                result.articles.forEach((article, index) => {
                    const createdDate = article.created_at ? new Date(article.created_at) : null;
                    const updatedDate = article.updated_at ? new Date(article.updated_at) : null;
                    const publishedDate = article.published_at ? new Date(article.published_at) : null;
                    
                    const isPublished = article.medium_url;
                    
                    // Format dates
                    const formatDate = (date) => date ? date.toLocaleDateString() : 'N/A';
                    
                    // Calculate time to publish
                    let timeToPublish = '';
                    if (isPublished && createdDate && publishedDate) {
                        const diffTime = publishedDate.getTime() - createdDate.getTime();
                        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                        timeToPublish = diffDays === 1 ? '1 day' : `${diffDays} days`;
                    }
                    
                    const tags = article.tags.map(tag => `<span class="history-tag">${tag}</span>`).join('');
                    
                    html += `
                        <div class="history-item">
                            <h3>${article.title || 'Untitled'}</h3>
                            <div class="history-meta">
                                <span><i class="fas fa-file-alt"></i> ${article.word_count} words</span>
                                <span><i class="fas fa-tag"></i> ${article.publish_status}</span>
                                <span><i class="fas fa-plus-circle"></i> Created: ${formatDate(createdDate)}</span>
                                ${updatedDate && updatedDate.getTime() !== createdDate.getTime() ? 
                                    `<span><i class="fas fa-edit"></i> Updated: ${formatDate(updatedDate)}</span>` : ''}
                                ${isPublished ? 
                                    `<span><i class="fas fa-paper-plane"></i> Published: ${formatDate(publishedDate)}</span>` : ''}
                                ${timeToPublish ? 
                                    `<span class="time-to-publish"><i class="fas fa-clock"></i> ${timeToPublish}</span>` : ''}
                            </div>
                            ${tags ? `<div class="history-tags">${tags}</div>` : ''}
                            <div class="history-content">
                                ${article.content.substring(0, 150)}${article.content.length > 150 ? '...' : ''}
                            </div>
                            <div class="history-actions">
                                <button class="btn-primary" onclick="loadArticle(${article.doc_id})">
                                    <i class="fas fa-edit"></i> Edit
                                </button>
                                ${isPublished ? 
                                    `<a href="${article.medium_url}" target="_blank" class="btn-success">
                                        <i class="fas fa-external-link-alt"></i> View on Medium
                                    </a>` : 
                                    `<button class="btn-success" onclick="publishArticle(${article.doc_id})">
                                        <i class="fas fa-paper-plane"></i> Publish
                                    </button>`
                                }
                                <button class="btn-danger" onclick="deleteArticle(${article.doc_id})">
                                    <i class="fas fa-trash"></i> Delete
                                </button>
                            </div>
                        </div>
                    `;
                });
                historyContent.innerHTML = html;
            } else {
                historyContent.innerHTML = `
                    <div style="text-align: center; padding: 40px; color: #64748b;">
                        <i class="fas fa-history" style="font-size: 3rem; margin-bottom: 20px; color: #cbd5e1;"></i>
                        <p>No articles or drafts yet.</p>
                        <p>Your articles and drafts will appear here.</p>
                    </div>
                `;
            }
        } catch (error) {
            historyContent.innerHTML = `
                <div style="color: #ef4444; text-align: center; padding: 20px;">
                    <i class="fas fa-exclamation-triangle"></i>
                    <p>Failed to load history: ${error.message}</p>
                </div>
            `;
        }
    }

    function showNotification(message, type) {
        notification.textContent = message;
        notification.className = `notification ${type} show`;
        
        setTimeout(() => {
            notification.classList.remove('show');
        }, 3000);
    }

    // Global functions for history actions
    window.deleteArticle = async function(articleId) {
        if (!articleId || articleId === 'undefined') {
            showNotification('Invalid article ID', 'error');
            return;
        }

        try {
            const response = await fetch(`/history/${articleId}`, {
                method: 'DELETE'
            });

            if (response.ok) {
                showNotification('Article removed from history', 'success');
                loadHistory();
                
                if (currentArticleId == articleId) {
                    currentArticleId = null;
                    lastSavedContent = '';
                }
            } else {
                showNotification('Failed to delete article', 'error');
            }
        } catch (error) {
            showNotification('Error deleting article: ' + error.message, 'error');
        }
    };

    window.loadArticle = async function(articleId) {
        try {
            const response = await fetch(`/article/${articleId}`);
            const result = await response.json();

            if (response.ok) {
                const article = result.article;
                
                titleInput.value = article.title || '';
                markdownEditor.value = article.content || '';
                tagsInput.value = article.tags.join(', ') || '';
                publishStatus.value = article.publish_status || 'draft';
                
                currentArticleId = articleId;
                lastSavedContent = article.content || '';
                
                editorSection.style.display = 'block';
                updatePreview();
                
                // Show header upload button when editor is displayed
                headerUploadBtn.style.display = 'inline-flex';
                
                historyOverlay.classList.remove('show');
                
                showNotification('Article loaded successfully', 'success');
            } else {
                showNotification('Failed to load article', 'error');
            }
        } catch (error) {
            showNotification('Error loading article: ' + error.message, 'error');
        }
    };

    window.publishArticle = async function(articleId) {
        try {
            const response = await fetch(`/article/${articleId}`);
            const result = await response.json();

            if (response.ok) {
                const article = result.article;
                
                titleInput.value = article.title || '';
                markdownEditor.value = article.content || '';
                tagsInput.value = article.tags.join(', ') || '';
                publishStatus.value = article.publish_status || 'draft';
                
                currentArticleId = articleId;
                lastSavedContent = article.content || '';
                
                editorSection.style.display = 'block';
                updatePreview();
                
                // Show header upload button when editor is displayed
                headerUploadBtn.style.display = 'inline-flex';
                
                historyOverlay.classList.remove('show');
                
                await publishArticleLocal();
            } else {
                showNotification('Failed to load article for publishing', 'error');
            }
        } catch (error) {
            showNotification('Error loading article: ' + error.message, 'error');
        }
    };

    // Initialize preview
    updatePreview();
});