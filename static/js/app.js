// App state
let state = {
    releases: [],
    categories: [],
    filter: 'all',
    search: '',
    sort: 'newest',
    isLoading: false,
    selectedRelease: null
};

// DOM Elements
const elements = {
    refreshBtn: document.getElementById('refresh-btn'),
    searchInput: document.getElementById('search-input'),
    clearSearchBtn: document.getElementById('clear-search'),
    categoryPills: document.getElementById('category-pills-container'),
    sortSelect: document.getElementById('sort-select'),
    releasesFeed: document.getElementById('releases-feed'),
    skeletonLoader: document.getElementById('skeleton-loader'),
    feedStatusMsg: document.getElementById('feed-status-msg'),
    
    // Modal Elements
    tweetModal: document.getElementById('tweet-modal'),
    closeModalBtn: document.getElementById('close-modal'),
    cancelTweetBtn: document.getElementById('cancel-tweet'),
    submitTweetBtn: document.getElementById('submit-tweet'),
    tweetTextarea: document.getElementById('tweet-textarea'),
    charCounter: document.getElementById('char-counter'),
    tweetMediaTitle: document.getElementById('tweet-media-title'),
    tweetMediaDesc: document.getElementById('tweet-media-desc')
};

// Helper: Strip HTML tags to get plain text
function stripHtml(html) {
    const doc = new DOMParser().parseFromString(html, 'text/html');
    return doc.body.textContent || "";
}

// Format date for nicer UI display
function formatDate(dateStr) {
    try {
        const options = { year: 'numeric', month: 'long', day: 'numeric' };
        // Handle standard release note format (e.g., June 17, 2026) directly if possible
        if (dateStr.includes(',')) return dateStr;
        
        const date = new Date(dateStr);
        return date.toLocaleDateString('en-US', options);
    } catch (e) {
        return dateStr;
    }
}

// Fetch releases from Python backend
async function fetchReleases(forceRefresh = false) {
    state.isLoading = true;
    showLoadingState();
    
    const url = `/api/releases${forceRefresh ? '?refresh=true' : ''}`;
    
    try {
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
        }
        
        const data = await response.json();
        
        if (data.error) {
            throw new Error(data.error);
        }
        
        state.releases = data.releases || [];
        state.categories = data.categories || [];
        
        if (data.warning) {
            showStatus(data.warning, 'warning');
        } else {
            hideStatus();
        }
        
        renderCategoryFilters();
        renderFeed();
    } catch (error) {
        console.error("Error fetching release notes:", error);
        showStatus(`Failed to load release notes: ${error.message}. Please try again.`, 'error');
        state.releases = [];
        renderFeed();
    } finally {
        state.isLoading = false;
        hideLoadingState();
    }
}

// UI State Toggles
function showLoadingState() {
    elements.skeletonLoader.style.display = 'block';
    elements.releasesFeed.style.display = 'none';
    elements.refreshBtn.classList.add('btn-primary');
    elements.refreshBtn.querySelector('.sync-icon').classList.add('spinning');
    elements.refreshBtn.disabled = true;
}

function hideLoadingState() {
    elements.skeletonLoader.style.display = 'none';
    elements.releasesFeed.style.display = 'block';
    elements.refreshBtn.querySelector('.sync-icon').classList.remove('spinning');
    elements.refreshBtn.disabled = false;
}

function showStatus(msg, type = 'error') {
    elements.feedStatusMsg.textContent = msg;
    elements.feedStatusMsg.className = `feed-status ${type}`;
    elements.feedStatusMsg.style.display = 'block';
}

function hideStatus() {
    elements.feedStatusMsg.style.display = 'none';
}

// Render dynamic category selector pills
function renderCategoryFilters() {
    // Keep 'All' pill, rebuild others
    const activeFilter = state.filter;
    elements.categoryPills.innerHTML = `<button class="pill ${activeFilter === 'all' ? 'active' : ''}" data-category="all">All</button>`;
    
    state.categories.forEach(cat => {
        const pill = document.createElement('button');
        pill.className = `pill ${activeFilter === cat ? 'active' : ''}`;
        pill.setAttribute('data-category', cat);
        pill.textContent = cat;
        elements.categoryPills.appendChild(pill);
    });
}

// Filter and Sort releases according to current state
function getFilteredAndSortedReleases() {
    let result = [...state.releases];
    
    // Category filter
    if (state.filter !== 'all') {
        result = result.filter(r => r.category === state.filter);
    }
    
    // Search query filter
    if (state.search.trim()) {
        const query = state.search.toLowerCase().trim();
        result = result.filter(r => {
            const plainTextDesc = stripHtml(r.description).toLowerCase();
            return r.category.toLowerCase().includes(query) || 
                   r.date.toLowerCase().includes(query) || 
                   plainTextDesc.includes(query);
        });
    }
    
    // Date sorting
    result.sort((a, b) => {
        const dateA = new Date(a.updated || a.date);
        const dateB = new Date(b.updated || b.date);
        
        if (state.sort === 'newest') {
            return dateB - dateA;
        } else {
            return dateA - dateB;
        }
    });
    
    return result;
}

// Render the main feed of release cards
function renderFeed() {
    const filtered = getFilteredAndSortedReleases();
    elements.releasesFeed.innerHTML = '';
    
    if (filtered.length === 0) {
        elements.releasesFeed.innerHTML = `
            <div class="feed-status warning" style="display:block; background-color: rgba(255,255,255,0.02); border-color: var(--border-color); color: var(--text-secondary);">
                No release notes found matching your criteria. Try adjusting your filters or search.
            </div>
        `;
        return;
    }
    
    filtered.forEach(item => {
        const card = document.createElement('article');
        card.className = 'release-card';
        card.setAttribute('data-category', item.category);
        card.id = `release-${item.id.replace(/[^a-zA-Z0-9]/g, '-')}`;
        
        const catClass = item.category.toLowerCase().replace(/\s+/g, '-');
        const displayDate = formatDate(item.date);
        
        card.innerHTML = `
            <div class="card-header">
                <div class="card-metadata">
                    <span class="category-tag ${catClass}">${item.category}</span>
                </div>
                <time class="card-date" datetime="${item.updated}">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
                        <line x1="16" y1="2" x2="16" y2="6"/>
                        <line x1="8" y1="2" x2="8" y2="6"/>
                        <line x1="3" y1="10" x2="21" y2="10"/>
                    </svg>
                    <span>${displayDate}</span>
                </time>
            </div>
            
            <div class="card-content">
                ${item.description}
            </div>
            
            <div class="card-footer">
                ${item.link ? `
                <a href="${item.link}" class="btn btn-secondary btn-card-action" target="_blank" rel="noopener noreferrer">
                    <span>Source Feed</span>
                    <svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6M15 3h6v6M10 14L21 3"/>
                    </svg>
                </a>
                ` : ''}
                <button class="btn btn-tweet btn-card-action tweet-btn" data-id="${item.id}">
                    <svg class="icon" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                    </svg>
                    <span>Tweet This</span>
                </button>
            </div>
        `;
        
        elements.releasesFeed.appendChild(card);
    });
    
    // Attach Tweet click events
    document.querySelectorAll('.tweet-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const releaseId = btn.getAttribute('data-id');
            const release = state.releases.find(r => r.id === releaseId);
            if (release) {
                openTweetComposer(release);
            }
        });
    });
}

// Tweet Composer Modal Business Logic
const HASHTAGS_SUFFIX = " #BigQuery #GoogleCloud";
const MAX_TOTAL_CHARS = 280;
const URL_MOCK_LENGTH = 23; // X counts all URLs as 23 characters
// Budget for textarea = 280 - 23 (URL) - 23 (tags & spaces) = 234 characters
const TWEET_TEXTAREA_MAX = MAX_TOTAL_CHARS - URL_MOCK_LENGTH - HASHTAGS_SUFFIX.length - 1; 

function openTweetComposer(item) {
    state.selectedRelease = item;
    
    const plainDesc = stripHtml(item.description)
        .replace(/\s+/g, ' ')
        .trim();
        
    const prefix = `BigQuery ${item.category} (${item.date}): `;
    
    // Calculate how many characters we can afford for the description
    const budgetForDesc = TWEET_TEXTAREA_MAX - prefix.length;
    
    let descText = plainDesc;
    if (descText.length > budgetForDesc) {
        descText = descText.substring(0, budgetForDesc - 3) + "...";
    }
    
    // Set initial text inside textarea
    const defaultComposeText = `${prefix}${descText}`;
    elements.tweetTextarea.value = defaultComposeText;
    elements.tweetTextarea.setAttribute('maxlength', TWEET_TEXTAREA_MAX);
    
    // Fill the link card preview inside the modal
    elements.tweetMediaTitle.textContent = `Google BigQuery Release Notes - ${item.date}`;
    elements.tweetMediaDesc.textContent = plainDesc;
    
    updateCharacterCount();
    
    // Show Modal
    elements.tweetModal.classList.add('open');
    elements.tweetModal.setAttribute('aria-hidden', 'false');
    elements.tweetTextarea.focus();
}

function updateCharacterCount() {
    const currentLength = elements.tweetTextarea.value.length;
    
    // Character math:
    // Total used = currentLength + URL_MOCK_LENGTH (23) + HASHTAGS_SUFFIX (22) + 1 (space)
    const totalUsed = currentLength + URL_MOCK_LENGTH + HASHTAGS_SUFFIX.length + 1;
    const remaining = MAX_TOTAL_CHARS - totalUsed;
    
    elements.charCounter.textContent = remaining;
    
    if (remaining < 0) {
        elements.charCounter.className = 'char-counter danger';
        elements.submitTweetBtn.disabled = true;
    } else if (remaining < 20) {
        elements.charCounter.className = 'char-counter warning';
        elements.submitTweetBtn.disabled = false;
    } else {
        elements.charCounter.className = 'char-counter';
        elements.submitTweetBtn.disabled = false;
    }
}

function closeTweetComposer() {
    elements.tweetModal.classList.remove('open');
    elements.tweetModal.setAttribute('aria-hidden', 'true');
    state.selectedRelease = null;
}

// Event Listeners setup
function setupEventListeners() {
    // Refresh Button Click
    elements.refreshBtn.addEventListener('click', () => {
        fetchReleases(true);
    });
    
    // Search Box Input
    elements.searchInput.addEventListener('input', (e) => {
        state.search = e.target.value;
        if (state.search.length > 0) {
            elements.clearSearchBtn.style.display = 'block';
        } else {
            elements.clearSearchBtn.style.display = 'none';
        }
        renderFeed();
    });
    
    // Clear Search Click
    elements.clearSearchBtn.addEventListener('click', () => {
        elements.searchInput.value = '';
        state.search = '';
        elements.clearSearchBtn.style.display = 'none';
        elements.searchInput.focus();
        renderFeed();
    });
    
    // Filter Pills Click
    elements.categoryPills.addEventListener('click', (e) => {
        const pill = e.target.closest('.pill');
        if (!pill) return;
        
        // Remove active class from all and add to clicked
        document.querySelectorAll('.pill').forEach(p => p.classList.remove('active'));
        pill.classList.add('active');
        
        state.filter = pill.getAttribute('data-category');
        renderFeed();
    });
    
    // Sort Select Change
    elements.sortSelect.addEventListener('change', (e) => {
        state.sort = e.target.value;
        renderFeed();
    });
    
    // Modal Listeners
    elements.closeModalBtn.addEventListener('click', closeTweetComposer);
    elements.cancelTweetBtn.addEventListener('click', closeTweetComposer);
    
    // Close modal on overlay click
    elements.tweetModal.addEventListener('click', (e) => {
        if (e.target === elements.tweetModal) {
            closeTweetComposer();
        }
    });
    
    // Character limit text area listener
    elements.tweetTextarea.addEventListener('input', updateCharacterCount);
    
    // Submit Tweet (Opens X post intent)
    elements.submitTweetBtn.addEventListener('click', () => {
        if (!state.selectedRelease) return;
        
        const text = elements.tweetTextarea.value;
        const link = state.selectedRelease.link;
        
        // Build the full tweet content: custom text + link + hashtags
        const fullTweetText = `${text} ${link}${HASHTAGS_SUFFIX}`;
        
        // X/Twitter Web Intent URL
        const twitterUrl = `https://x.com/intent/post?text=${encodeURIComponent(fullTweetText)}`;
        
        // Open share intent in a new window
        window.open(twitterUrl, '_blank', 'noopener,noreferrer');
        
        closeTweetComposer();
    });
    
    // Close modal on Escape key press
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && elements.tweetModal.classList.contains('open')) {
            closeTweetComposer();
        }
    });
}

// Initial App Boot
document.addEventListener('DOMContentLoaded', () => {
    setupEventListeners();
    fetchReleases(false);
});
