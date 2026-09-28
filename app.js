// Antigravity Music Player - Core Logic

const AUDIO_EXTS = ['.mp3', '.m4a', '.m4v', '.alac', '.flac', '.wav', '.ogg', '.aac', '.opus', '.caf'];
const IMAGE_EXTS = ['.jpg', '.jpeg', '.png', '.webp'];

const State = {
    dirHandle: null,
    libraryPath: '',
    files: new Map(), // relativePath -> FileHandle
    meta: {}, // relativePath -> Metadata object
    tree: { name: 'root', path: '', children: {}, files: [], images: [], artUrl: null },
    currentTracks: [], // List of paths currently shown in tracks view
    currentFolderPath: null,
    queue: [],
    queueIndex: -1,
    audioContext: null,
    decodedCache: new Map(), // path -> ObjectURL
    contextMenuTarget: null, // { type: 'track'|'folder'|'queue', data: ... }
    mobileView: 'library' // 'library' | 'tracks' | 'queue' | 'nowplaying'
};

let audioDecodeLib = null;
let isDecodingFallback = false;

// DOM Elements
const DOM = {
    appContainer: document.getElementById('app-container'),
    btnOpen: document.getElementById('btn-open-folder'),
    libraryFolderName: document.getElementById('library-folder-name'),
    treeRoot: document.getElementById('tree-root'),
    treeEmpty: document.getElementById('explorer-empty-state'),
    reopenCard: document.getElementById('reopen-card'),
    reopenFolderName: document.getElementById('reopen-folder-name'),
    btnReopenFolder: document.getElementById('btn-reopen-folder'),
    
    // Tracks Pane
    tracksPaneTitle: document.getElementById('tracks-pane-title'),
    currentFolderLabel: document.getElementById('current-folder-label'),
    tracksTbody: document.getElementById('tracks-tbody'),
    tracksEmpty: document.getElementById('tracks-empty-state'),
    btnPlayAll: document.getElementById('btn-play-all'),
    
    // Queue Drawer
    queueDrawer: document.getElementById('queue-drawer'),
    btnQueue: document.getElementById('btn-queue'),
    btnCloseQueue: document.getElementById('btn-close-queue'),
    btnShuffleQueue: document.getElementById('btn-shuffle-queue'),
    btnClearQueue: document.getElementById('btn-clear-queue'),
    queueCountBadge: document.getElementById('queue-count-badge'),
    queueNowPlaying: document.getElementById('queue-now-playing'),
    queueList: document.getElementById('queue-list'),

    // Mobile Navigation & Combined Queue
    mobileNav: document.getElementById('mobile-nav'),
    mobileCombinedQueue: document.getElementById('mobile-combined-queue'),
    mobileQueueBadge: document.getElementById('mobile-queue-badge'),
    mobileQueueList: document.getElementById('mobile-queue-list'),
    btnMobileShuffleQueue: document.getElementById('btn-mobile-shuffle-queue'),
    btnMobileClearQueue: document.getElementById('btn-mobile-clear-queue'),
    
    // Context Menu
    contextMenu: document.getElementById('context-menu'),
    cmDividerRemove: document.getElementById('cm-divider-remove'),
    cmItemRemove: document.getElementById('cm-item-remove'),
    
    // Player
    audio: document.getElementById('audio-player'),
    btnPlayPause: document.getElementById('btn-play-pause'),
    btnPrev: document.getElementById('btn-prev'),
    btnNext: document.getElementById('btn-next'),
    npTitle: document.getElementById('np-title'),
    npArtist: document.getElementById('np-artist'),
    npMeta: document.getElementById('np-meta'),
    npArt: document.getElementById('np-art'),
    
    // Scrubber
    timeCurrent: document.getElementById('time-current'),
    timeTotal: document.getElementById('time-total'),
    seekSlider: document.getElementById('seek-slider'),
    waveformCanvas: document.getElementById('waveform-canvas'),
    scrubberProgress: document.getElementById('scrubber-progress'),
    volumeSlider: document.getElementById('volume-slider'),
    
    notifications: document.getElementById('notifications-container')
};

// ==========================================
// IndexedDB Directory & Metadata Persistence
// ==========================================
const DB_NAME = 'BasePlayerDB';
const DB_STORE_HANDLES = 'handles';
const DB_STORE_META = 'meta_cache';
const NO_ART_SVG = `data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><rect width='100' height='100' fill='%2388888820'/><text x='50' y='50' fill='%23888888' font-family='sans-serif' font-size='13' text-anchor='middle' dominant-baseline='middle'>No Art</text></svg>`;

function getDB() {
    return new Promise((resolve, reject) => {
        const req = indexedDB.open(DB_NAME, 2);
        req.onupgradeneeded = (e) => {
            const db = req.result;
            if (!db.objectStoreNames.contains(DB_STORE_HANDLES)) {
                db.createObjectStore(DB_STORE_HANDLES);
            }
            if (!db.objectStoreNames.contains(DB_STORE_META)) {
                db.createObjectStore(DB_STORE_META);
            }
        };
        req.onsuccess = () => resolve(req.result);
        req.onerror = () => reject(req.error);
    });
}

async function saveDirectoryHandle(handle) {
    try {
        const db = await getDB();
        const tx = db.transaction(DB_STORE_HANDLES, 'readwrite');
        tx.objectStore(DB_STORE_HANDLES).put(handle, 'lastDirHandle');
        localStorage.setItem('baseplayer_last_dir_name', handle.name);
    } catch (e) {
        console.warn('Could not save directory handle to IndexedDB', e);
    }
}

async function getSavedDirectoryHandle() {
    try {
        const db = await getDB();
        return new Promise((resolve) => {
            const tx = db.transaction(DB_STORE_HANDLES, 'readonly');
            const req = tx.objectStore(DB_STORE_HANDLES).get('lastDirHandle');
            req.onsuccess = () => resolve(req.result || null);
            req.onerror = () => resolve(null);
        });
    } catch (e) {
        return null;
    }
}

// ==========================================
// Folder Metadata Persistence (Stored alongside user data)
// ==========================================
const META_FILE_NAME = 'baseplayer_meta.json';
const LEGACY_META_NAMES = ['baseplayer_meta.json', '.baseplayer_meta.json', 'library_meta.json'];

// Load cached metadata (durations, waveforms, tags, artwork) directly from the user's selected folder
async function loadFolderMetaFile(dirHandle) {
    if (!dirHandle) return false;
    for (const name of LEGACY_META_NAMES) {
        try {
            const metaHandle = await dirHandle.getFileHandle(name);
            const file = await metaHandle.getFile();
            const text = await file.text();
            const parsed = JSON.parse(text);
            if (parsed && typeof parsed === 'object') {
                for (const k in parsed) {
                    if (parsed[k] && parsed[k].artworkUrl && parsed[k].artworkUrl.startsWith('blob:')) {
                        delete parsed[k].artworkUrl;
                    }
                }
                Object.assign(State.meta, parsed);
                console.log(`[BasePlayer] Successfully loaded metadata file (${name}) directly from selected folder (${Object.keys(parsed).length} tracks ready)`);
                return true;
            }
        } catch (e) {
            // File not present or unreadable, check next candidate
        }
    }
    return false;
}

// Save metadata file directly into the user's selected folder
let folderSaveTimer = null;
let isSavingFolder = false;

function queueMetaSave(path) {
    if (folderSaveTimer) clearTimeout(folderSaveTimer);
    folderSaveTimer = setTimeout(saveFolderMetaFile, 400);
}

async function saveFolderMetaFile() {
    if (!State.dirHandle || isSavingFolder) return;
    isSavingFolder = true;
    try {
        const handle = await State.dirHandle.getFileHandle(META_FILE_NAME, { create: true });
        const writable = await handle.createWritable();
        
        // Strip non-persistent blob URLs before saving to disk
        const cleanMeta = {};
        for (const k in State.meta) {
            const item = { ...State.meta[k] };
            if (item.artworkUrl && item.artworkUrl.startsWith('blob:')) {
                delete item.artworkUrl;
            }
            cleanMeta[k] = item;
        }
        
        await writable.write(JSON.stringify(cleanMeta, null, 2));
        await writable.close();
        console.log(`[BasePlayer] Persisted metadata directly to "${META_FILE_NAME}" in user folder`);
    } catch (e) {
        console.warn(`[BasePlayer] Could not write "${META_FILE_NAME}" to folder:`, e);
        // Fallback to IndexedDB backup if folder write is blocked
        await saveLocalIndexedDBCache();
    } finally {
        isSavingFolder = false;
    }
}

async function saveMetaFile() {
    await saveFolderMetaFile();
}

async function flushMetaSaves() {
    await saveFolderMetaFile();
}

// Fallback backup cache in browser IndexedDB
async function loadLocalMetaCache(dirName) {
    try {
        const db = await getDB();
        return new Promise((resolve) => {
            const tx = db.transaction(DB_STORE_META, 'readonly');
            const store = tx.objectStore(DB_STORE_META);
            const req = store.openCursor();
            const prefix = `${dirName}::`;
            let loadedCount = 0;
            req.onsuccess = (e) => {
                const cursor = e.target.result;
                if (cursor) {
                    if (typeof cursor.key === 'string' && cursor.key.startsWith(prefix)) {
                        const relPath = cursor.key.slice(prefix.length);
                        if (!State.meta[relPath]) {
                            State.meta[relPath] = cursor.value;
                            loadedCount++;
                        }
                    }
                    cursor.continue();
                } else {
                    if (loadedCount > 0) {
                        console.log(`[BasePlayer] Restored ${loadedCount} entries from secondary local cache for "${dirName}"`);
                    }
                    resolve();
                }
            };
            req.onerror = () => resolve();
        });
    } catch (e) {
        console.warn('Could not read secondary cache from IndexedDB:', e);
    }
}

async function saveLocalIndexedDBCache() {
    if (!State.dirHandle) return;
    try {
        const db = await getDB();
        const tx = db.transaction(DB_STORE_META, 'readwrite');
        const store = tx.objectStore(DB_STORE_META);
        const dirName = State.dirHandle.name;
        for (const [p, m] of Object.entries(State.meta)) {
            store.put(m, `${dirName}::${p}`);
        }
    } catch (e) {
        console.warn('Failed to sync secondary cache:', e);
    }
}

// ==========================================
// Audio Format & Decoder Utilities (ALAC, M4A, M4V, etc.)
// ==========================================

// Fallback software decoder for ALAC / lossless M4A files
async function decodeAudioFallback(file, path) {
    if (State.decodedCache.has(path)) {
        const cached = State.decodedCache.get(path);
        if (cached && typeof cached === 'object' && cached.decodedResult) {
            return cached;
        }
        if (typeof cached === 'string') {
            return { url: cached };
        }
    }

    if (!State.audioContext) {
        State.audioContext = new (window.AudioContext || window.webkitAudioContext)();
    }
    if (State.audioContext.state === 'suspended') {
        try { await State.audioContext.resume(); } catch (e) {}
    }
    
    const arrayBuffer = await file.arrayBuffer();
    let decodedResult = null;
    
    // 1. Try native Web Audio API decodeAudioData
    try {
        decodedResult = await State.audioContext.decodeAudioData(arrayBuffer.slice(0));
    } catch (eNative) {
        // Native decodeAudioData failed, attempt pre-loaded decoder
    }
    
    // 2. If native failed, use window.audioDecode pre-loaded with the window
    if (!decodedResult) {
        try {
            const decoder = window.audioDecode || (await import('https://esm.sh/audio-decode')).default;
            if (decoder) {
                decodedResult = await decoder(arrayBuffer);
            }
        } catch (eLib) {
            console.error('Pre-loaded decoder failed for ALAC/M4A:', eLib);
        }
    }
    
    if (!decodedResult) {
        throw new Error('Codec not supported by browser or decoder.');
    }
    
    const wavBlob = audioBufferToWav(decodedResult);
    const url = URL.createObjectURL(wavBlob);
    const cacheEntry = { url, decodedResult };
    State.decodedCache.set(path, cacheEntry);
    return cacheEntry;
}

// Convert AudioBuffer OR { channelData, sampleRate } to standard WAV Blob
function audioBufferToWav(buffer) {
    let channels = [];
    let sampleRate = 44100;
    
    if (buffer.getChannelData) {
        // Standard Web Audio API AudioBuffer
        sampleRate = buffer.sampleRate;
        for (let i = 0; i < buffer.numberOfChannels; i++) {
            channels.push(buffer.getChannelData(i));
        }
    } else if (buffer.channelData) {
        // Decoded object from audio-decode: { channelData: [Float32Array...], sampleRate }
        sampleRate = buffer.sampleRate || 44100;
        channels = buffer.channelData;
    }
    
    const numChannels = channels.length || 1;
    const bitDepth = 16;
    
    let interleaved;
    if (numChannels === 2) {
        const left = channels[0];
        const right = channels[1];
        interleaved = new Float32Array(left.length + right.length);
        for (let src = 0, dst = 0; src < left.length; src++) {
            interleaved[dst++] = left[src];
            interleaved[dst++] = right[src];
        }
    } else {
        interleaved = channels[0] || new Float32Array(0);
    }
    
    const bytesPerSample = bitDepth / 8;
    const blockAlign = numChannels * bytesPerSample;
    const dataSize = interleaved.length * bytesPerSample;
    const headerSize = 44;
    const totalSize = headerSize + dataSize;
    
    const arrayBuffer = new ArrayBuffer(totalSize);
    const view = new DataView(arrayBuffer);
    
    function writeString(view, offset, string) {
        for (let i = 0; i < string.length; i++) {
            view.setUint8(offset + i, string.charCodeAt(i));
        }
    }
    
    writeString(view, 0, 'RIFF');
    view.setUint32(4, 36 + dataSize, true);
    writeString(view, 8, 'WAVE');
    writeString(view, 12, 'fmt ');
    view.setUint32(16, 16, true);
    view.setUint16(20, 1, true); // PCM format
    view.setUint16(22, numChannels, true);
    view.setUint32(24, sampleRate, true);
    view.setUint32(28, sampleRate * blockAlign, true);
    view.setUint16(32, blockAlign, true);
    view.setUint16(34, bitDepth, true);
    writeString(view, 36, 'data');
    view.setUint32(40, dataSize, true);
    
    // Lightning-fast typed array conversion (under 10ms for full track)
    const pcmView = new Int16Array(arrayBuffer, 44, interleaved.length);
    for (let i = 0; i < interleaved.length; i++) {
        const s = interleaved[i];
        pcmView[i] = s < -1 ? -32768 : s > 1 ? 32767 : (s * 32767) | 0;
    }
    
    return new Blob([view], { type: 'audio/wav' });
}

// ==========================================
// Initialization
// ==========================================
document.addEventListener('DOMContentLoaded', async () => {
    DOM.btnOpen.addEventListener('click', handleOpenFolder);
    
    // Player Events
    DOM.btnPlayPause.addEventListener('click', togglePlay);
    DOM.btnPrev.addEventListener('click', playPrev);
    DOM.btnNext.addEventListener('click', playNext);
    DOM.audio.addEventListener('timeupdate', updateProgress);
    DOM.audio.addEventListener('ended', handleTrackEnded);
    DOM.audio.addEventListener('error', handleAudioError);
    DOM.seekSlider.addEventListener('input', seekAudio);
    DOM.volumeSlider.addEventListener('input', (e) => { DOM.audio.volume = e.target.value; });
    if (DOM.npArt) {
        DOM.npArt.addEventListener('error', () => {
            if (DOM.npArt.src === NO_ART_SVG || DOM.npArt.src.includes('data:image/svg+xml')) return;
            const currentPath = State.queueIndex !== -1 ? State.queue[State.queueIndex] : null;
            if (currentPath) {
                if (State.meta[currentPath] && State.meta[currentPath].artworkUrl && State.meta[currentPath].artworkUrl.startsWith('blob:')) {
                    delete State.meta[currentPath].artworkUrl;
                }
                const recoveredArt = getArtworkForTrack(currentPath);
                if (recoveredArt && recoveredArt !== DOM.npArt.src) {
                    DOM.npArt.src = recoveredArt;
                    return;
                }
            }
            DOM.npArt.src = NO_ART_SVG;
        });
    }
    
    DOM.btnPlayAll.addEventListener('click', () => {
        if (State.currentTracks.length > 0) {
            playTrackQueue(State.currentTracks, 0);
        }
    });

    // Queue Drawer Events
    DOM.btnQueue.addEventListener('click', toggleQueueDrawer);
    DOM.btnCloseQueue.addEventListener('click', () => setQueueDrawerOpen(false));
    DOM.btnShuffleQueue.addEventListener('click', shuffleQueue);
    DOM.btnClearQueue.addEventListener('click', clearQueue);

    // Global Context Menu Dismissal
    document.addEventListener('click', (e) => {
        if (!DOM.contextMenu.contains(e.target)) {
            hideContextMenu();
        }
    });
    window.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') hideContextMenu();
    });

    // Context Menu Action Delegation
    DOM.contextMenu.addEventListener('click', handleContextMenuAction);

    // Dynamic theme change listener to redraw waveform matching system mode
    if (window.matchMedia) {
        window.matchMedia('(prefers-color-scheme: light)').addEventListener('change', () => {
            if (State.queueIndex !== -1 && State.queue[State.queueIndex]) {
                const path = State.queue[State.queueIndex];
                const meta = State.meta[path];
                if (meta && meta.waveform && Array.isArray(meta.waveform) && meta.waveform.length > 0) {
                    drawWaveform(meta.waveform);
                }
            }
        });
    }

    // Window resize listener to recompute waveform canvas dimensions
    window.addEventListener('resize', () => {
        if (State.queueIndex !== -1 && State.queue[State.queueIndex]) {
            const path = State.queue[State.queueIndex];
            const meta = State.meta[path];
            if (meta && meta.waveform && Array.isArray(meta.waveform) && meta.waveform.length > 0) {
                drawWaveform(meta.waveform);
            }
        }
    });

    // Mobile Navigation & View Switching
    if (DOM.appContainer) {
        DOM.appContainer.classList.add('view-library');
    }
    
    if (DOM.mobileNav) {
        DOM.mobileNav.addEventListener('click', (e) => {
            const btn = e.target.closest('.mobile-nav-btn');
            if (btn && btn.dataset.view) {
                setMobileView(btn.dataset.view);
            }
        });
    }

    const playerInfoEl = document.querySelector('.player-info');
    if (playerInfoEl) {
        playerInfoEl.addEventListener('click', () => {
            if (window.innerWidth <= 768) {
                setMobileView('nowplaying');
            }
        });
    }

    if (DOM.btnMobileShuffleQueue) {
        DOM.btnMobileShuffleQueue.addEventListener('click', shuffleQueue);
    }
    if (DOM.btnMobileClearQueue) {
        DOM.btnMobileClearQueue.addEventListener('click', clearQueue);
    }

    // Ensure playback continuity when device is locked or app loses focus
    document.addEventListener('visibilitychange', () => {
        if (document.hidden && !DOM.audio.paused) {
            if ('mediaSession' in navigator) {
                navigator.mediaSession.playbackState = 'playing';
            }
        }
    });

    // Auto-reopen last folder if available
    await checkLastOpenedFolder();
});

// Mobile View Controller (Library, Tracks, Now Playing)
function setMobileView(view) {
    State.mobileView = view;
    if (!DOM.appContainer) return;
    
    DOM.appContainer.classList.remove('view-library', 'view-tracks', 'view-queue', 'view-nowplaying');
    DOM.appContainer.classList.add(`view-${view}`);
    
    if (DOM.mobileNav) {
        DOM.mobileNav.querySelectorAll('.mobile-nav-btn').forEach(btn => {
            if (btn.dataset.view === view) {
                btn.classList.add('active');
            } else {
                btn.classList.remove('active');
            }
        });
    }
    
    // Recalculate waveform canvas dimensions after view transition
    setTimeout(() => {
        if (State.queueIndex !== -1 && State.queue[State.queueIndex]) {
            const path = State.queue[State.queueIndex];
            const meta = State.meta[path];
            if (meta && meta.waveform && Array.isArray(meta.waveform) && meta.waveform.length > 0) {
                drawWaveform(meta.waveform);
            }
        }
    }, 60);
}

async function checkLastOpenedFolder() {
    const handle = await getSavedDirectoryHandle();
    const savedName = localStorage.getItem('baseplayer_last_dir_name') || (handle ? handle.name : '');
    if (!handle) return;
    
    try {
        let status = await handle.queryPermission({ mode: 'readwrite' });
        if (status !== 'granted') {
            status = await handle.queryPermission({ mode: 'read' });
        }
        if (status === 'granted') {
            State.dirHandle = handle;
            State.libraryPath = handle.name;
            if (DOM.libraryFolderName) DOM.libraryFolderName.textContent = handle.name;
            DOM.treeEmpty.style.display = 'none';
            DOM.treeRoot.innerHTML = '<div class="tree-item"><i class="fa-solid fa-spinner fa-spin"></i> Restoring previous library...</div>';
            await loadLibrary(handle);
            return;
        }
    } catch (e) {
        console.warn('Error querying handle permission', e);
    }
    
    if (savedName && DOM.reopenCard) {
        DOM.reopenFolderName.textContent = savedName;
        DOM.reopenCard.classList.remove('hidden');
        DOM.btnReopenFolder.onclick = async () => {
            try {
                let status = await handle.requestPermission({ mode: 'readwrite' });
                if (status !== 'granted') {
                    status = await handle.requestPermission({ mode: 'read' });
                }
                if (status === 'granted') {
                    DOM.reopenCard.classList.add('hidden');
                    State.dirHandle = handle;
                    State.libraryPath = handle.name;
                    if (DOM.libraryFolderName) DOM.libraryFolderName.textContent = handle.name;
                    DOM.treeEmpty.style.display = 'none';
                    DOM.treeRoot.innerHTML = '<div class="tree-item"><i class="fa-solid fa-spinner fa-spin"></i> Loading library...</div>';
                    await loadLibrary(handle);
                } else {
                    showNotification('Permission not granted to access folder.', true);
                }
            } catch (err) {
                console.error(err);
                showNotification('Could not reopen folder: ' + err.message, true);
            }
        };
    }
}

function showNotification(msg, isError = false) {
    // Keep max 2 visible notifications to avoid cascading toast floods
    while (DOM.notifications.children.length >= 2) {
        DOM.notifications.firstElementChild.remove();
    }
    const div = document.createElement('div');
    div.className = `notification ${isError ? 'error' : ''}`;
    div.innerHTML = `<i class="fa-solid ${isError ? 'fa-circle-exclamation' : 'fa-info-circle'}"></i> <span>${msg}</span>`;
    DOM.notifications.appendChild(div);
    setTimeout(() => div.remove(), 4000);
}

function formatTime(seconds) {
    if (isNaN(seconds) || seconds < 0) return '0:00';
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
}

function formatBytes(bytes) {
    if (!bytes || bytes === 0) return '0 B';
    const k = 1024, sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

// ==========================================
// File System & Indexing
// ==========================================
async function handleOpenFolder() {
    try {
        const dirHandle = await window.showDirectoryPicker({ mode: 'readwrite' });
        State.dirHandle = dirHandle;
        State.libraryPath = dirHandle.name;
        if (DOM.libraryFolderName) DOM.libraryFolderName.textContent = dirHandle.name;
        
        DOM.treeEmpty.style.display = 'none';
        DOM.treeRoot.innerHTML = '<div class="tree-item"><i class="fa-solid fa-spinner fa-spin"></i> Indexing library...</div>';
        
        await saveDirectoryHandle(dirHandle);
        await loadLibrary(dirHandle);
    } catch (err) {
        console.error(err);
        if (err.name !== 'AbortError') {
            showNotification('Failed to open folder: ' + err.message, true);
        }
    }
}

async function loadLibrary(dirHandle) {
    State.files.clear();
    State.tree = { name: dirHandle.name, path: '', children: {}, files: [], images: [], artUrl: null, handle: dirHandle };
    State.meta = {};
    if (DOM.libraryFolderName) DOM.libraryFolderName.textContent = dirHandle.name;
    
    // 1. First, load metadata stored directly alongside the user's data in the selected folder
    const loadedFromFolder = await loadFolderMetaFile(dirHandle);
    if (!loadedFromFolder) {
        // Fallback to local IndexedDB backup if no metadata file exists in folder yet
        await loadLocalMetaCache(dirHandle.name);
    }
    
    await walkDirectory(dirHandle, State.tree, '');
    await resolveFolderLocalArt(State.tree);
    
    renderTree();
    autoSelectInitialFolder();
    processMetadataQueue();
}

async function walkDirectory(dirHandle, treeNode, currentPath) {
    for await (const entry of dirHandle.values()) {
        // Skip metadata cache files from appearing in tracks or tree
        if (entry.name === 'baseplayer_meta.json' || entry.name === '.baseplayer_meta.json' || entry.name === 'library_meta.json') {
            continue;
        }
        
        const entryPath = currentPath ? `${currentPath}/${entry.name}` : entry.name;
        
        if (entry.kind === 'file') {
            const ext = entry.name.toLowerCase().substring(entry.name.lastIndexOf('.'));
            if (AUDIO_EXTS.includes(ext)) {
                State.files.set(entryPath, entry);
                treeNode.files.push(entryPath);
                
                if (!State.meta[entryPath]) {
                    State.meta[entryPath] = { path: entryPath, name: entry.name, ext, size: 0, enriched: false };
                }
            } else if (IMAGE_EXTS.includes(ext)) {
                treeNode.images.push(entry);
            }
        } else if (entry.kind === 'directory') {
            const childNode = { name: entry.name, path: entryPath, children: {}, files: [], images: [], artUrl: null, handle: entry };
            treeNode.children[entry.name] = childNode;
            await walkDirectory(entry, childNode, entryPath);
        }
    }
}

// Find local album cover image in folder
async function resolveFolderLocalArt(node) {
    if (node.images && node.images.length > 0) {
        const priorityRegex = /(cover|folder|front|album|artwork|art)/i;
        let bestImage = node.images.find(img => priorityRegex.test(img.name)) || node.images[0];
        try {
            const imgFile = await bestImage.getFile();
            node.artUrl = URL.createObjectURL(imgFile);
        } catch (e) {
            console.warn('Could not read image file', e);
        }
    }
    
    for (const key in node.children) {
        await resolveFolderLocalArt(node.children[key]);
    }
}

// ==========================================
// Metadata Extraction & Open Source Scrubbing
// ==========================================
async function processMetadataQueue() {
    let changed = false;
    let count = 0;
    
    for (const [path, handle] of State.files.entries()) {
        const meta = State.meta[path];
        if (!meta) continue;
        
        // 1. Basic File Info
        if (!meta.size) {
            try {
                const file = await handle.getFile();
                meta.size = file.size;
                changed = true;
            } catch (e) {}
        }
        
        // 2. Local ID3 Tags / MP4 Atoms (supports MP3, M4A, ALAC, FLAC, M4V)
        if (!meta.title && !meta.id3_parsed) {
            try {
                const file = await handle.getFile();
                const tags = await readID3Tags(file);
                if (tags) {
                    meta.title = tags.title || meta.name.replace(meta.ext, '');
                    meta.artist = tags.artist || 'Unknown Artist';
                    meta.album = tags.album || 'Unknown Album';
                    
                    if (tags.picture) {
                        try {
                            const { data, format } = tags.picture;
                            let base64String = "";
                            for (let i = 0; i < data.length; i++) {
                                base64String += String.fromCharCode(data[i]);
                            }
                            meta.artworkUrl = `data:${format};base64,${window.btoa(base64String)}`;
                        } catch (errPic) {
                            console.warn("Failed to decode ID3/MP4 picture", errPic);
                        }
                    }
                }
            } catch (e) {
                meta.title = meta.name.replace(meta.ext, '');
                meta.artist = 'Unknown Artist';
                meta.album = 'Unknown Album';
            }
            meta.id3_parsed = true;
            changed = true;
        }
        
        // 3. Fallback to folder local art
        if (!meta.artworkUrl) {
            const folderNode = findNodeByPath(State.tree, path.substring(0, path.lastIndexOf('/')));
            if (folderNode && folderNode.artUrl) {
                meta.artworkUrl = folderNode.artUrl;
            }
        }
        
        if (changed) {
            queueMetaSave(path);
            changed = false;
        }
    }
    
    await flushMetaSaves();

    // 4. Batch resolve and cache artwork for all albums/folders missing art
    await resolveMissingFolderArtwork();
    
    updateAllTreeThumbnails();
    if (State.currentTracks.length > 0) {
        renderTracks(State.currentTracks);
    }
    if (State.queueIndex !== -1) {
        const currentPlayingPath = State.queue[State.queueIndex];
        if (currentPlayingPath) {
            const currentArt = getArtworkForTrack(currentPlayingPath);
            if (currentArt && (DOM.npArt.src === NO_ART_SVG || DOM.npArt.src.includes('data:image/svg+xml') || !DOM.npArt.src)) {
                DOM.npArt.src = currentArt;
                const currentMeta = State.meta[currentPlayingPath];
                if (currentMeta) updateMediaSession(currentMeta, currentArt);
            }
        }
        renderQueue();
    }
}

function readID3Tags(file) {
    return new Promise((resolve, reject) => {
        if (!window.jsmediatags) {
            return resolve(null);
        }
        window.jsmediatags.read(file, {
            onSuccess: function(tag) {
                resolve(tag.tags);
            },
            onError: function(error) {
                resolve(null);
            }
        });
    });
}

// Clean rip tags and release noise: e.g. "pbthal", "pbthall", "flac", "remastered", "vinyl", "deluxe edition", etc.
function stripRipTags(str) {
    if (!str || typeof str !== 'string') return '';
    return str
        .replace(/\b(pbthal+|flac|alac|wav|mp3|320kbps|320|180g|vinyl|lp|cd\d*|disc\s*\d+|remaster(ed)?|deluxe(\s+edition)?|anniversary(\s+edition)?|bonus(\s+tracks)?|web|hi-res|lossless|24[.-]?96|24[.-]?192|24bit|96khz)\b/gi, '')
        .replace(/[([{|/].*?[)\]}]/g, '') // remove bracketed text e.g. [2014], (Deluxe), [24.96 FLAC]
        .replace(/[-–—_.:]+$/, '')
        .replace(/^[-–—_.:]+/, '')
        .replace(/\s+/g, ' ')
        .trim();
}

function generateSearchQueries(title, artist, album, folderName) {
    const queries = [];
    const validArtist = (artist && artist !== 'Unknown Artist' && artist.trim().length > 0) ? artist.trim() : '';
    const validAlbum = (album && album !== 'Unknown Album' && album.trim().length > 0) ? album.trim() : '';
    const cleanTitle = (title || '').replace(/^\d+[\s.-]+/, '').replace(/[([{|/].*?[)\]}]/g, '').trim();

    // 1. If folderName or album is like "Artist - Album" or "Album - Tag" (e.g. "Stone Temple Pilots- Purple PBTHALL", "jason mraz - Yes", "Dookie - pbthal")
    const namesToTest = [folderName, validAlbum].filter(Boolean);
    for (const name of namesToTest) {
        if (/[-–—]/.test(name)) {
            // Split by dash with optional spaces on either side (e.g. "Pilots- Purple")
            const parts = name.split(/\s*[-–—]+\s*/).map(p => p.trim()).filter(Boolean);
            if (parts.length >= 2) {
                const part0Clean = stripRipTags(parts[0]);
                const part1Clean = stripRipTags(parts[1]);
                
                // If part 1 was purely a rip tag (like pbthal / PBTHALL): query is part0Clean + validArtist
                if (parts[1] && !part1Clean && part0Clean) {
                    if (validArtist) {
                        queries.push(`${part0Clean} ${validArtist}`);
                        queries.push(`${validArtist} ${part0Clean}`);
                    } else {
                        queries.push(part0Clean);
                    }
                } 
                // If both parts are real words (like "Stone Temple Pilots" & "Purple", or "jason mraz" & "Yes"):
                else if (part0Clean && part1Clean) {
                    queries.push(`${part0Clean} ${part1Clean}`);
                    queries.push(`${part1Clean} ${part0Clean}`);
                    if (validArtist) {
                        queries.push(`${part1Clean} ${validArtist}`);
                        queries.push(`${part0Clean} ${validArtist}`);
                    }
                }
            }
        }
    }

    // 2. Clean album + artist
    const cleanAlbum = stripRipTags(validAlbum || folderName || '');
    if (cleanAlbum && validArtist) {
        queries.push(`${cleanAlbum} ${validArtist}`);
        queries.push(`${validArtist} ${cleanAlbum}`);
    } else if (cleanAlbum) {
        queries.push(cleanAlbum);
    }

    // 3. Track title + artist
    if (cleanTitle && validArtist) {
        queries.push(`${cleanTitle} ${validArtist}`);
        queries.push(`${validArtist} ${cleanTitle}`);
    }

    // Return unique queries
    return Array.from(new Set(queries.filter(q => q && q.length > 1)));
}

async function scrubOpenSourceArtwork(title, artist, album, folderName) {
    const queries = generateSearchQueries(title, artist, album, folderName);
    const validArtist = (artist && artist !== 'Unknown Artist' && artist.trim().length > 0) ? artist.toLowerCase() : '';

    for (const query of queries) {
        // 1. Try iTunes Album Search with media=music
        try {
            const res = await fetch(`https://itunes.apple.com/search?term=${encodeURIComponent(query)}&media=music&entity=album&limit=5`);
            if (res.ok) {
                const data = await res.json();
                if (data.results && data.results.length > 0) {
                    let bestMatch = data.results[0];
                    const queryLower = query.toLowerCase();
                    const perfectMatch = data.results.find(r => {
                        const colName = (r.collectionName || '').toLowerCase();
                        const artName = (r.artistName || '').toLowerCase();
                        return (validArtist ? artName.includes(validArtist) : true) && 
                               (queryLower.split(' ').some(word => word.length > 3 && colName.includes(word)));
                    });
                    if (perfectMatch) bestMatch = perfectMatch;
                    else if (validArtist) {
                        const artistMatch = data.results.find(r => 
                            r.artistName && (r.artistName.toLowerCase().includes(validArtist) || validArtist.includes(r.artistName.toLowerCase()))
                        );
                        if (artistMatch) bestMatch = artistMatch;
                    }
                    if (bestMatch && bestMatch.artworkUrl100) {
                        return bestMatch.artworkUrl100.replace('100x100bb', '600x600bb');
                    }
                }
            }
        } catch (e) {}

        // 2. Try iTunes Song Search with media=music
        try {
            const res = await fetch(`https://itunes.apple.com/search?term=${encodeURIComponent(query)}&media=music&entity=song&limit=5`);
            if (res.ok) {
                const data = await res.json();
                if (data.results && data.results.length > 0) {
                    let bestMatch = data.results[0];
                    const queryLower = query.toLowerCase();
                    const perfectMatch = data.results.find(r => {
                        const colName = (r.collectionName || '').toLowerCase();
                        const artName = (r.artistName || '').toLowerCase();
                        return (validArtist ? artName.includes(validArtist) : true) && 
                               (queryLower.split(' ').some(word => word.length > 3 && colName.includes(word)));
                    });
                    if (perfectMatch) bestMatch = perfectMatch;
                    else if (validArtist) {
                        const artistMatch = data.results.find(r => 
                            r.artistName && (r.artistName.toLowerCase().includes(validArtist) || validArtist.includes(r.artistName.toLowerCase()))
                        );
                        if (artistMatch) bestMatch = artistMatch;
                    }
                    if (bestMatch && bestMatch.artworkUrl100) {
                        return bestMatch.artworkUrl100.replace('100x100bb', '600x600bb');
                    }
                }
            }
        } catch (e) {}

        // 3. Fallback to MusicBrainz release-group & Cover Art Archive
        try {
            let mbQuery = `releasegroup:${encodeURIComponent(query)}`;
            if (validArtist) mbQuery += ` AND artist:${encodeURIComponent(validArtist)}`;
            const mbRes = await fetch(`https://musicbrainz.org/ws/2/release-group/?query=${mbQuery}&fmt=json&limit=1`, {
                headers: { 'User-Agent': 'AliPlayer/2.0 ( https://alidark3000.github.io )' }
            });
            if (mbRes.ok) {
                const mbData = await mbRes.json();
                const rgs = mbData['release-groups'];
                if (rgs && rgs.length > 0) {
                    const rgid = rgs[0].id;
                    const caaUrl = `https://coverartarchive.org/release-group/${rgid}/front-500`;
                    return caaUrl;
                }
            }
        } catch (e) {}
    }

    return null;
}

// Cache artwork directly in the album's folder as cover.jpg on disk
async function cacheArtworkInAlbumFolder(folderNode, imageUrl) {
    if (!folderNode || !folderNode.handle || !imageUrl) return null;
    try {
        const res = await fetch(imageUrl);
        if (!res.ok) return null;
        const blob = await res.blob();
        
        const coverHandle = await folderNode.handle.getFileHandle('cover.jpg', { create: true });
        const writable = await coverHandle.createWritable();
        await writable.write(blob);
        await writable.close();
        
        const localBlobUrl = URL.createObjectURL(blob);
        folderNode.artUrl = localBlobUrl;
        if (!folderNode.images) folderNode.images = [];
        folderNode.images.unshift(coverHandle);
        
        console.log(`[AliPlayer] Successfully cached cover.jpg in album folder: ${folderNode.name}`);
        return localBlobUrl;
    } catch (e) {
        console.warn(`[AliPlayer] Could not cache cover.jpg to album folder (${folderNode.name}):`, e);
        return null;
    }
}

// Batch resolve and cache artwork for all album folders missing art
async function resolveMissingFolderArtwork() {
    const foldersToProcess = [];
    function collectFolders(node) {
        if (!node) return;
        if (node.files && node.files.length > 0) {
            foldersToProcess.push(node);
        }
        for (const k in node.children) {
            collectFolders(node.children[k]);
        }
    }
    collectFolders(State.tree);

    for (const folder of foldersToProcess) {
        // If folder already has local artUrl, or all tracks have artworkUrl, skip
        let hasArt = !!folder.artUrl;
        if (!hasArt) {
            for (const f of folder.files) {
                if (State.meta[f] && State.meta[f].artworkUrl) {
                    folder.artUrl = State.meta[f].artworkUrl;
                    hasArt = true;
                    break;
                }
            }
        }
        if (hasArt) continue;

        // Find track with best metadata in this folder
        let bestMeta = null;
        for (const f of folder.files) {
            const m = State.meta[f];
            if (m && m.artist && m.artist !== 'Unknown Artist') {
                bestMeta = m;
                break;
            }
        }
        if (!bestMeta && folder.files.length > 0) {
            bestMeta = State.meta[folder.files[0]];
        }
        if (!bestMeta) continue;

        const title = bestMeta.title || '';
        let artist = (bestMeta.artist && bestMeta.artist !== 'Unknown Artist') ? bestMeta.artist : '';
        const album = (bestMeta.album && bestMeta.album !== 'Unknown Album') ? bestMeta.album : '';
        const folderName = folder.name || '';

        // If artist is missing or unknown, check if folder has a parent folder (e.g. "the police/Outlandos d'Amour")
        if (!artist && folder.path && folder.path.includes('/')) {
            const parentPath = folder.path.substring(0, folder.path.lastIndexOf('/'));
            const parentFolder = findNodeByPath(State.tree, parentPath);
            if (parentFolder && parentFolder.name && parentFolder.name !== State.tree.name) {
                artist = parentFolder.name;
            }
        }

        try {
            const artUrl = await scrubOpenSourceArtwork(title, artist, album, folderName);
            if (artUrl) {
                // 1. Try to cache cover.jpg directly in the folder on disk
                if (folder.handle) {
                    await cacheArtworkInAlbumFolder(folder, artUrl);
                }
                
                // 2. Set folder.artUrl so tree thumbnail updates
                if (!folder.artUrl) folder.artUrl = artUrl;
                updateTreeNodeArt(folder);

                // 3. Propagate persistent HTTPS artworkUrl to all tracks in this folder
                for (const f of folder.files) {
                    if (State.meta[f]) {
                        State.meta[f].artworkUrl = artUrl;
                        State.meta[f].art_scrubbed = true;
                        queueMetaSave(f);
                    }
                }

                // If currently playing track is in this folder, update now playing immediately
                if (State.queueIndex !== -1 && folder.files.includes(State.queue[State.queueIndex])) {
                    DOM.npArt.src = artUrl;
                    const curMeta = State.meta[State.queue[State.queueIndex]];
                    if (curMeta) updateMediaSession(curMeta, artUrl);
                }
            }
            // Gentle 120ms pause between folders to avoid Apple API rate limits
            await new Promise(r => setTimeout(r, 120));
        } catch (err) {
            console.warn(`[AliPlayer] Could not resolve artwork for folder: ${folder.name}`, err);
        }
    }
    await flushMetaSaves();
    updateAllTreeThumbnails();
}

// On-demand artwork resolution for active track
async function resolveTrackArtwork(path, parentNode) {
    const meta = State.meta[path];
    if (!meta) return;
    
    // Check if hierarchical or selected folder art is already available
    const existingArt = getArtworkForTrack(path);
    if (existingArt) {
        meta.artworkUrl = existingArt;
        if (State.queueIndex !== -1 && State.queue[State.queueIndex] === path) {
            DOM.npArt.src = existingArt;
            updateMediaSession(meta, existingArt);
        }
        queueMetaSave(path);
        renderQueue();
        return;
    }
    
    const targetFolderNode = parentNode || findNodeByPath(State.tree, path.includes('/') ? path.substring(0, path.lastIndexOf('/')) : '') || State.tree;
    const folderName = targetFolderNode ? targetFolderNode.name : '';

    try {
        const externalArtUrl = await scrubOpenSourceArtwork(meta.title, meta.artist, meta.album, folderName);
        if (externalArtUrl) {
            meta.artworkUrl = externalArtUrl;
            
            if (State.queueIndex !== -1 && State.queue[State.queueIndex] === path) {
                DOM.npArt.src = externalArtUrl;
                updateMediaSession(meta, externalArtUrl);
            }
            if (targetFolderNode) {
                targetFolderNode.artUrl = externalArtUrl;
                updateTreeNodeArt(targetFolderNode);
                if (targetFolderNode.handle) {
                    await cacheArtworkInAlbumFolder(targetFolderNode, externalArtUrl);
                }
            }
            queueMetaSave(path);
            renderQueue();
        }
    } catch (e) {
        console.warn("Error resolving track artwork:", e);
    }
}

// ==========================================
// UI Rendering - Explorer (Contents at Top Level)
// ==========================================
function renderTree() {
    DOM.treeRoot.innerHTML = '';
    
    const childKeys = Object.keys(State.tree.children);
    const hasDirectFiles = State.tree.files.length > 0;
    
    if (childKeys.length === 0 && !hasDirectFiles) {
        DOM.treeRoot.innerHTML = '<div class="empty-state" style="padding: 20px 0;"><p>No audio files or folders found.</p></div>';
        return;
    }
    
    // 1. "All Library Tracks" item at top
    const allFiles = getAllFiles(State.tree);
    if (allFiles.length > 0) {
        const allItem = document.createElement('div');
        allItem.className = 'tree-item';
        allItem.innerHTML = `
            <div class="tree-row selected" data-path="__all__">
                <span class="tree-expander empty"></span>
                <div class="tree-thumbnail-placeholder"><i class="fa-solid fa-list-music"></i></div>
                <span class="tree-label">All Tracks</span>
                <span class="tree-count">${allFiles.length}</span>
            </div>
        `;
        const row = allItem.querySelector('.tree-row');
        row.addEventListener('click', () => {
            collapseUnrelatedBranches('__all__');
            selectExplorerRow(row, allFiles, 'All Tracks');
        });
        row.addEventListener('contextmenu', (e) => {
            e.preventDefault();
            showContextMenu(e.clientX, e.clientY, { type: 'folder', tracks: allFiles, title: 'All Tracks' });
        });
        DOM.treeRoot.appendChild(allItem);
    }
    
    // 2. Direct tracks inside root
    if (hasDirectFiles && childKeys.length > 0) {
        const directFiles = [...State.tree.files].sort((a, b) => 
            a.split('/').pop().localeCompare(b.split('/').pop(), undefined, { numeric: true, sensitivity: 'base' })
        );
        const directItem = document.createElement('div');
        directItem.className = 'tree-item';
        directItem.innerHTML = `
            <div class="tree-row" data-path="__direct__">
                <span class="tree-expander empty"></span>
                <div class="tree-thumbnail-placeholder"><i class="fa-solid fa-folder-open"></i></div>
                <span class="tree-label">[Root Tracks]</span>
                <span class="tree-count">${directFiles.length}</span>
            </div>
        `;
        const row = directItem.querySelector('.tree-row');
        row.addEventListener('click', () => {
            collapseUnrelatedBranches('__direct__');
            selectExplorerRow(row, directFiles, '[Root Tracks]');
        });
        row.addEventListener('contextmenu', (e) => {
            e.preventDefault();
            showContextMenu(e.clientX, e.clientY, { type: 'folder', tracks: directFiles, title: '[Root Tracks]' });
        });
        DOM.treeRoot.appendChild(directItem);
    }
    
    // 3. Child folders directly at the top level (only folders containing music files)
    const validTopKeys = childKeys.filter(key => {
        const tracks = getAllFiles(State.tree.children[key]);
        return tracks && tracks.length > 0;
    });

    validTopKeys.sort((a, b) => a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' })).forEach(key => {
        const childNode = State.tree.children[key];
        const el = createTreeNode(childNode);
        if (el) DOM.treeRoot.appendChild(el);
    });
}

function collapseUnrelatedBranches(targetPath) {
    const expandedItems = document.querySelectorAll('.tree-item.expanded');
    expandedItems.forEach(item => {
        const itemPath = item.getAttribute('data-node-path');
        if (!itemPath) return;
        
        // If targetPath is not this node and not a descendant of this node, collapse it
        const isAncestorOrSelf = targetPath && (targetPath === itemPath || targetPath.startsWith(itemPath + '/'));
        if (!isAncestorOrSelf) {
            collapseTreeNode(item);
        }
    });
}

function collapseTreeNode(itemEl) {
    itemEl.classList.remove('expanded');
    
    const childrenContainer = Array.from(itemEl.children).find(c => c.classList.contains('tree-children'));
    if (childrenContainer) {
        childrenContainer.classList.remove('expanded');
    }
    
    const row = Array.from(itemEl.children).find(c => c.classList.contains('tree-row'));
    if (row) {
        const icon = row.querySelector('.tree-icon');
        if (icon && icon.classList.contains('fa-folder-open')) {
            icon.classList.remove('fa-folder-open');
            icon.classList.add('fa-folder');
        }
    }
    
    // Recursively collapse any nested subfolders
    itemEl.querySelectorAll('.tree-item.expanded').forEach(subItem => {
        collapseTreeNode(subItem);
    });
}

function createTreeNode(node) {
    const allTracks = getAllFiles(node);
    // If a folder is empty or does not contain music files, do not display it
    if (!allTracks || allTracks.length === 0) {
        return null;
    }

    const div = document.createElement('div');
    div.className = 'tree-item';
    div.setAttribute('data-node-path', node.path);
    
    const row = document.createElement('div');
    row.className = 'tree-row';
    row.setAttribute('data-path', node.path);
    
    // Only count child folders that actually contain music files
    const validChildKeys = Object.keys(node.children).filter(k => {
        const childTracks = getAllFiles(node.children[k]);
        return childTracks && childTracks.length > 0;
    });
    const hasChildren = validChildKeys.length > 0;
    
    let expanderHtml = hasChildren 
        ? `<i class="tree-expander fa-solid fa-chevron-right"></i>` 
        : `<span class="tree-expander empty"></span>`;

    let thumbHtml = '';
    const artUrl = getEffectiveNodeArt(node);
    if (artUrl) {
        thumbHtml = `<img class="tree-thumbnail" src="${artUrl}" alt="" />`;
    } else {
        thumbHtml = `<div class="tree-thumbnail-placeholder"><i class="tree-icon fa-solid ${hasChildren ? 'fa-folder' : 'fa-compact-disc'}"></i></div>`;
    }
    
    row.innerHTML = `
        ${expanderHtml}
        ${thumbHtml}
        <span class="tree-label" title="${node.name}">${node.name}</span>
        <span class="tree-count">${allTracks.length}</span>
    `;
    
    div.appendChild(row);
    
    const childrenContainer = document.createElement('div');
    childrenContainer.className = 'tree-children';
    
    if (hasChildren) {
        validChildKeys.sort((a, b) => a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' })).forEach(k => {
            const childEl = createTreeNode(node.children[k]);
            if (childEl) childrenContainer.appendChild(childEl);
        });
    }
    div.appendChild(childrenContainer);
    
    // Single click expands parent folder and collapses unrelated subfolders
    row.addEventListener('click', () => {
        const wasExpanded = childrenContainer.classList.contains('expanded');
        
        // When navigating away from a parent folder (or its children), collapse its subfolders
        collapseUnrelatedBranches(node.path);
        
        if (hasChildren) {
            if (wasExpanded) {
                collapseTreeNode(div);
            } else {
                childrenContainer.classList.add('expanded');
                div.classList.add('expanded');
                const icon = row.querySelector('.tree-icon');
                if (icon) {
                    icon.classList.remove('fa-folder');
                    icon.classList.add('fa-folder-open');
                }
            }
        }
        selectExplorerRow(row, allTracks, node.name);
        localStorage.setItem('baseplayer_last_selected_path', node.path);
    });
    
    row.addEventListener('contextmenu', (e) => {
        e.preventDefault();
        showContextMenu(e.clientX, e.clientY, { type: 'folder', tracks: allTracks, title: node.name });
    });
    
    return div;
}

function selectExplorerRow(rowEl, tracks, label, isInitial = false) {
    document.querySelectorAll('.tree-row').forEach(el => el.classList.remove('selected'));
    rowEl.classList.add('selected');
    State.currentTracks = tracks;

    const titleEl = DOM.tracksPaneTitle || document.getElementById('tracks-pane-title');
    if (titleEl) {
        if (!label || label === 'All Tracks') {
            titleEl.innerHTML = '<i class="fa-solid fa-list-music"></i> All Tracks';
        } else if (label === '[Root Tracks]') {
            titleEl.innerHTML = '<i class="fa-solid fa-folder-open"></i> [Root Tracks]';
        } else {
            titleEl.innerHTML = `<i class="fa-solid fa-record-vinyl"></i> <span title="${label}">${label}</span>`;
        }
    }

    if (DOM.currentFolderLabel) {
        DOM.currentFolderLabel.textContent = `${tracks.length} ${tracks.length === 1 ? 'track' : 'tracks'}`;
    }
    renderTracks(tracks);
    DOM.btnPlayAll.disabled = tracks.length === 0;
}

function autoSelectInitialFolder() {
    const savedPath = localStorage.getItem('baseplayer_last_selected_path');
    if (savedPath) {
        const targetRow = document.querySelector(`.tree-row[data-path="${savedPath}"]`);
        if (targetRow) {
            const path = targetRow.getAttribute('data-path');
            const node = findNodeByPath(State.tree, path);
            const tracks = node ? getAllFiles(node) : [];
            selectExplorerRow(targetRow, tracks, node ? node.name : '', true);
            return;
        }
    }
    
    const firstRow = document.querySelector('.tree-row');
    if (firstRow) {
        const path = firstRow.getAttribute('data-path');
        const tracks = path === '__all__' ? getAllFiles(State.tree) : (path === '__direct__' ? State.tree.files : []);
        selectExplorerRow(firstRow, tracks, firstRow.querySelector('.tree-label')?.textContent || '', true);
    }
}

function getEffectiveNodeArt(node) {
    if (!node) return null;
    if (node.artUrl) return node.artUrl;
    for (const f of node.files) {
        const m = State.meta[f];
        if (m && m.artworkUrl && !m.artworkUrl.startsWith('blob:')) return m.artworkUrl;
    }
    for (const k in node.children) {
        const subArt = getEffectiveNodeArt(node.children[k]);
        if (subArt) return subArt;
    }
    return null;
}

// Hierarchically resolve artwork for any track (direct metadata, parent/ancestor folders, or selected folder)
function getArtworkForTrack(path) {
    if (!path) return null;
    const meta = State.meta[path];
    if (meta && meta.artworkUrl && !meta.artworkUrl.startsWith('blob:')) return meta.artworkUrl;
    
    // 1. Walk up from track's parent folder all the way to root
    let dirPath = path.includes('/') ? path.substring(0, path.lastIndexOf('/')) : '';
    while (true) {
        const node = findNodeByPath(State.tree, dirPath);
        if (node) {
            const art = getEffectiveNodeArt(node);
            if (art) return art;
        }
        if (!dirPath) break;
        const lastSlash = dirPath.lastIndexOf('/');
        dirPath = lastSlash !== -1 ? dirPath.substring(0, lastSlash) : '';
    }
    
    // 2. Check currently selected folder in Library explorer
    const selectedRow = document.querySelector('.tree-row.selected');
    if (selectedRow) {
        const selPath = selectedRow.getAttribute('data-path');
        if (selPath && selPath !== '__all__' && selPath !== '__direct__') {
            const selNode = findNodeByPath(State.tree, selPath);
            if (selNode) {
                const art = getEffectiveNodeArt(selNode);
                if (art) return art;
            }
        }
    }
    
    // 3. Fallback to root library art if available
    const rootArt = getEffectiveNodeArt(State.tree);
    if (rootArt) return rootArt;
    
    return null;
}

function updateTreeNodeArt(node) {
    const nodeEl = document.querySelector(`[data-node-path="${node.path}"]`);
    if (!nodeEl) return;
    const row = nodeEl.querySelector('.tree-row');
    if (!row) return;
    
    const artUrl = getEffectiveNodeArt(node);
    if (artUrl) {
        const existingPlaceholder = row.querySelector('.tree-thumbnail-placeholder');
        const existingThumb = row.querySelector('.tree-thumbnail');
        if (existingThumb) {
            existingThumb.src = artUrl;
        } else if (existingPlaceholder) {
            const img = document.createElement('img');
            img.className = 'tree-thumbnail';
            img.src = artUrl;
            row.replaceChild(img, existingPlaceholder);
        }
    }
}

function updateAllTreeThumbnails() {
    document.querySelectorAll('[data-node-path]').forEach(el => {
        const path = el.getAttribute('data-node-path');
        const node = findNodeByPath(State.tree, path);
        if (node) {
            updateTreeNodeArt(node);
        }
    });
}

function findNodeByPath(root, targetPath) {
    if (!targetPath) return root;
    if (root.path === targetPath) return root;
    for (const key in root.children) {
        const child = root.children[key];
        if (child.path === targetPath) return child;
        const found = findNodeByPath(child, targetPath);
        if (found) return found;
    }
    return null;
}

function getAllFiles(node) {
    let files = [...node.files];
    files.sort((a, b) => {
        const nameA = a.split('/').pop();
        const nameB = b.split('/').pop();
        return nameA.localeCompare(nameB, undefined, { numeric: true, sensitivity: 'base' });
    });
    
    const sortedChildKeys = Object.keys(node.children).sort((a, b) => 
        a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' })
    );
    for (const key of sortedChildKeys) {
        files = files.concat(getAllFiles(node.children[key]));
    }
    return files;
}

// ==========================================
// Tracks Table Rendering
// ==========================================
function renderTracks(paths) {
    DOM.tracksTbody.innerHTML = '';
    
    if (paths.length === 0) {
        DOM.tracksEmpty.style.display = 'flex';
        return;
    }
    DOM.tracksEmpty.style.display = 'none';
    
    paths.forEach((path, index) => {
        const meta = State.meta[path] || { name: path.split('/').pop(), ext: '', size: 0 };
        
        const tr = document.createElement('tr');
        if (State.queueIndex !== -1 && State.queue[State.queueIndex] === path) {
            tr.classList.add('playing');
        }
        
        tr.innerHTML = `
            <td class="track-num">${index + 1}</td>
            <td>${meta.title || meta.name}</td>
            <td>${meta.artist || ''}</td>
            <td>${meta.album || ''}</td>
            <td>${meta.duration ? formatTime(meta.duration) : '-'}</td>
            <td>${meta.ext ? meta.ext.substring(1).toUpperCase() : ''}</td>
        `;
        
        tr.addEventListener('click', () => {
            playTrackQueue(paths, index);
        });
        
        tr.addEventListener('contextmenu', (e) => {
            e.preventDefault();
            showContextMenu(e.clientX, e.clientY, { type: 'track', path, index, allTracks: paths });
        });
        
        DOM.tracksTbody.appendChild(tr);
    });
}

// ==========================================
// Audio Playback & Waveform (with ALAC & M4A support)
// ==========================================
async function playTrackQueue(queue, index) {
    if (index < 0 || index >= queue.length) return;
    
    State.queue = [...queue];
    State.queueIndex = index;
    isDecodingFallback = false;
    
    renderTracks(State.currentTracks);
    renderQueue();
    
    const path = queue[index];
    const handle = State.files.get(path);
    if (!handle) return;
    
    try {
        const file = await handle.getFile();
        const ext = file.name.toLowerCase().substring(file.name.lastIndexOf('.'));
        
        // Check cache first for instant 0ms playback
        let url;
        if (State.decodedCache.has(path)) {
            const cached = State.decodedCache.get(path);
            url = (cached && typeof cached === 'object') ? cached.url : cached;
        } else {
            url = URL.createObjectURL(file);
        }
        DOM.audio.src = url;
        
        // Update Player UI
        const meta = State.meta[path] || { name: file.name, ext: '' };
        DOM.npTitle.textContent = meta.title || file.name;
        DOM.npArtist.textContent = meta.artist || 'Unknown Artist';
        DOM.npMeta.textContent = `${meta.ext ? meta.ext.substring(1).toUpperCase() : ext.substring(1).toUpperCase()} • ${formatBytes(file.size)}`;
        
        let artSrc = getArtworkForTrack(path);
        
        if (artSrc) {
            DOM.npArt.src = artSrc;
        } else {
            DOM.npArt.src = NO_ART_SVG;
            // On-demand external artwork resolution & folder cache
            const parentNode = findNodeByPath(State.tree, path.includes('/') ? path.substring(0, path.lastIndexOf('/')) : '');
            resolveTrackArtwork(path, parentNode);
        }

        updateMediaSession(meta, artSrc || '');
        
        DOM.btnPlayPause.disabled = false;
        DOM.btnPrev.disabled = index === 0;
        DOM.btnNext.disabled = index >= queue.length - 1;
        DOM.seekSlider.disabled = false;
        
        try {
            await DOM.audio.play();
            DOM.btnPlayPause.innerHTML = '<i class="fa-solid fa-pause"></i>';
            if ('mediaSession' in navigator) navigator.mediaSession.playbackState = 'playing';
            // Pre-decode upcoming track in background during playback
            predecodeNextTrack();
        } catch (playError) {
            console.warn("Direct play() returned:", playError.name, playError.message);
            
            // AbortError occurs when play() is interrupted by a new load request (e.g. quick track switching).
            // This is normal and NOT a codec or format error.
            if (playError.name === 'AbortError') {
                return;
            }
            if (playError.name === 'NotAllowedError') {
                DOM.btnPlayPause.innerHTML = '<i class="fa-solid fa-play"></i>';
                return;
            }
            
            // Check if audio has already begun playing despite the promise rejection
            if (!DOM.audio.paused) {
                DOM.btnPlayPause.innerHTML = '<i class="fa-solid fa-pause"></i>';
                return;
            }

            // Real decode / format failure: attempt fallback
            await attemptAudioFallback(file, path);
        }
        
        // Generate/Load Waveform (uses cached waveform peaks if already saved)
        if (meta.waveform && Array.isArray(meta.waveform) && meta.waveform.length > 0) {
            drawWaveform(meta.waveform);
        } else {
            const canvas = DOM.waveformCanvas;
            if (canvas) {
                const ctx = canvas.getContext('2d');
                ctx.clearRect(0, 0, canvas.width, canvas.height);
            }
            generateWaveform(file, path);
        }
        
        renderQueue();
    } catch (e) {
        showNotification("Error playing file: " + e.message, true);
        console.error(e);
    }
}

async function attemptAudioFallback(file, path) {
    if (isDecodingFallback) return;
    if (!DOM.audio.paused && DOM.audio.currentTime > 0) return;
    
    isDecodingFallback = true;
    try {
        const ext = file.name.toLowerCase().substring(file.name.lastIndexOf('.'));
        if (ext === '.alac' || ext === '.m4a' || ext === '.m4v' || ext === '.caf') {
            try {
                showNotification("Decoding lossless audio (ALAC/M4A)...");
                const decoded = await decodeAudioFallback(file, path);
                DOM.audio.src = decoded.url;
                await DOM.audio.play();
                DOM.btnPlayPause.innerHTML = '<i class="fa-solid fa-pause"></i>';
                // Pre-decode upcoming track in background during playback
                predecodeNextTrack();
                return;
            } catch (errDec) {
                console.warn("Fallback decode failed:", errDec);
                // Only show warning if audio is not already playing
                if (DOM.audio.paused) {
                    showNotification(`Cannot play "${file.name}": Format/codec (ALAC) not supported by browser.`, true);
                    DOM.btnPlayPause.innerHTML = '<i class="fa-solid fa-play"></i>';
                }
            }
        } else {
            if (DOM.audio.paused) {
                showNotification(`Cannot play "${file.name}": format not supported by browser.`, true);
                DOM.btnPlayPause.innerHTML = '<i class="fa-solid fa-play"></i>';
            }
        }
    } finally {
        isDecodingFallback = false;
    }
}

// Background pre-decoding for upcoming queue tracks to eliminate buffering delays
function predecodeNextTrack() {
    if (State.queueIndex < 0 || State.queueIndex >= State.queue.length - 1) return;
    const nextPath = State.queue[State.queueIndex + 1];
    if (State.decodedCache.has(nextPath)) return;
    
    const ext = nextPath.toLowerCase().substring(nextPath.lastIndexOf('.'));
    if (ext === '.alac' || ext === '.m4a' || ext === '.m4v' || ext === '.caf') {
        const handle = State.files.get(nextPath);
        if (handle) {
            setTimeout(async () => {
                try {
                    const file = await handle.getFile();
                    const decoded = await decodeAudioFallback(file, nextPath);
                    console.log('[BasePlayer] Pre-decoded next track into cache:', nextPath);
                    
                    // Pre-compute waveform peaks for upcoming track so transition is instantaneous
                    const nextMeta = State.meta[nextPath];
                    if (nextMeta && (!nextMeta.waveform || !nextMeta.waveform.length) && decoded && decoded.decodedResult) {
                        const peaks = extractWaveformPeaks(decoded.decodedResult);
                        if (peaks && peaks.length > 0) {
                            nextMeta.waveform = peaks;
                            const dur = decoded.decodedResult.duration || (decoded.decodedResult.length && decoded.decodedResult.sampleRate ? decoded.decodedResult.length / decoded.decodedResult.sampleRate : 0);
                            if (dur && (!nextMeta.duration || isNaN(nextMeta.duration))) {
                                nextMeta.duration = dur;
                                updateTrackDurationInView(nextPath, dur);
                            }
                            queueMetaSave(nextPath);
                        }
                    }
                } catch (e) {
                    // AAC or other natively handled format doesn't need pre-decoding
                }
            }, 600);
        }
    }
}

function togglePlay() {
    if (DOM.audio.paused) {
        if (!DOM.audio.src && State.queue.length > 0) {
            playTrackQueue(State.queue, Math.max(0, State.queueIndex));
            return;
        }
        DOM.audio.play().then(() => {
            DOM.btnPlayPause.innerHTML = '<i class="fa-solid fa-pause"></i>';
            if ('mediaSession' in navigator) navigator.mediaSession.playbackState = 'playing';
        }).catch(err => {
            console.warn("togglePlay error:", err);
        });
    } else {
        DOM.audio.pause();
        DOM.btnPlayPause.innerHTML = '<i class="fa-solid fa-play"></i>';
        if ('mediaSession' in navigator) navigator.mediaSession.playbackState = 'paused';
    }
}

function playPrev() {
    if (State.queueIndex > 0) {
        playTrackQueue(State.queue, State.queueIndex - 1);
    }
}

function playNext() {
    if (State.queueIndex < State.queue.length - 1) {
        playTrackQueue(State.queue, State.queueIndex + 1);
    }
}

function handleTrackEnded() {
    // Only advance automatically when a track successfully finishes playing
    playNext();
}

function handleAudioError(e) {
    // If the audio element has no error, was aborted by user/track-switch, or is currently playing, ignore
    if (!DOM.audio.error || DOM.audio.error.code === 1 || !DOM.audio.paused) {
        return;
    }

    const currentPath = State.queueIndex !== -1 ? State.queue[State.queueIndex] : null;
    if (!currentPath) return;
    
    const handle = State.files.get(currentPath);
    if (handle && !isDecodingFallback) {
        handle.getFile().then(file => {
            attemptAudioFallback(file, currentPath);
        }).catch(err => {
            showNotification("Playback error: " + err.message, true);
        });
    }
}

function updateProgress() {
    if (!DOM.audio.duration) return;
    const current = DOM.audio.currentTime;
    const total = DOM.audio.duration;
    
    DOM.timeCurrent.textContent = formatTime(current);
    DOM.timeTotal.textContent = formatTime(total);
    
    const pct = (current / total) * 100;
    DOM.seekSlider.value = pct;
    
    if (State.queueIndex !== -1 && State.queue[State.queueIndex]) {
        const path = State.queue[State.queueIndex];
        const meta = State.meta[path];
        if (meta && meta.waveform && Array.isArray(meta.waveform) && meta.waveform.length > 0) {
            drawWaveform(meta.waveform, current / total);
        }
        if (meta && (!meta.duration || Math.abs(meta.duration - total) > 0.5)) {
            meta.duration = total;
            queueMetaSave(path);
            updateTrackDurationInView(path, total);
        }
    }

    updateMediaSessionPosition();
}

function seekAudio() {
    if (!DOM.audio.duration) return;
    const pct = DOM.seekSlider.value;
    const ratio = pct / 100;
    DOM.audio.currentTime = ratio * DOM.audio.duration;
    
    if (State.queueIndex !== -1 && State.queue[State.queueIndex]) {
        const path = State.queue[State.queueIndex];
        const meta = State.meta[path];
        if (meta && meta.waveform && Array.isArray(meta.waveform) && meta.waveform.length > 0) {
            drawWaveform(meta.waveform, ratio);
        }
    }

    updateMediaSessionPosition();
}

// Media Session API for lockscreen and background controls on mobile & desktop
function updateMediaSession(meta, artSrc) {
    if (!('mediaSession' in navigator)) return;
    try {
        const title = meta.title || meta.name || 'Unknown Track';
        const artist = meta.artist || 'Unknown Artist';
        const album = meta.album || 'Unknown Album';
        
        const artwork = [];
        if (artSrc && typeof artSrc === 'string' && !artSrc.startsWith('data:image/svg+xml')) {
            artwork.push({ src: artSrc, sizes: '512x512', type: 'image/jpeg' });
            artwork.push({ src: artSrc, sizes: '256x256', type: 'image/jpeg' });
            artwork.push({ src: artSrc, sizes: '96x96', type: 'image/jpeg' });
        }
        
        navigator.mediaSession.metadata = new MediaMetadata({
            title,
            artist,
            album,
            artwork
        });
        
        navigator.mediaSession.playbackState = DOM.audio.paused ? 'paused' : 'playing';
        
        navigator.mediaSession.setActionHandler('play', () => {
            DOM.audio.play();
            DOM.btnPlayPause.innerHTML = '<i class="fa-solid fa-pause"></i>';
            navigator.mediaSession.playbackState = 'playing';
        });
        
        navigator.mediaSession.setActionHandler('pause', () => {
            DOM.audio.pause();
            DOM.btnPlayPause.innerHTML = '<i class="fa-solid fa-play"></i>';
            navigator.mediaSession.playbackState = 'paused';
        });
        
        navigator.mediaSession.setActionHandler('previoustrack', playPrev);
        navigator.mediaSession.setActionHandler('nexttrack', playNext);
        
        try {
            navigator.mediaSession.setActionHandler('seekto', (details) => {
                if (details.seekTime !== undefined && DOM.audio.duration) {
                    DOM.audio.currentTime = details.seekTime;
                    updateProgress();
                }
            });
        } catch (e) {}
        
        try {
            navigator.mediaSession.setActionHandler('seekbackward', (details) => {
                const skipTime = details.seekOffset || 10;
                DOM.audio.currentTime = Math.max(DOM.audio.currentTime - skipTime, 0);
                updateProgress();
            });
            navigator.mediaSession.setActionHandler('seekforward', (details) => {
                const skipTime = details.seekOffset || 10;
                DOM.audio.currentTime = Math.min(DOM.audio.currentTime + skipTime, DOM.audio.duration || 0);
                updateProgress();
            });
        } catch (e) {}
    } catch (e) {
        console.warn('Failed to update MediaSession:', e);
    }
}

function updateMediaSessionPosition() {
    if (!('mediaSession' in navigator) || !navigator.mediaSession.setPositionState) return;
    try {
        if (DOM.audio.duration && !isNaN(DOM.audio.duration) && DOM.audio.duration > 0) {
            navigator.mediaSession.setPositionState({
                duration: DOM.audio.duration,
                playbackRate: DOM.audio.playbackRate || 1.0,
                position: Math.min(DOM.audio.currentTime, DOM.audio.duration)
            });
        }
    } catch (e) {}
}

// Extract and normalize 100 waveform peaks from decoded audio
function extractWaveformPeaks(decodedResult) {
    if (!decodedResult) return null;
    
    let channelData = null;
    if (typeof decodedResult.getChannelData === 'function') {
        channelData = decodedResult.getChannelData(0);
    } else if (decodedResult.channelData && decodedResult.channelData.length > 0) {
        channelData = decodedResult.channelData[0];
    }
    
    if (!channelData || channelData.length === 0) return null;
    
    const samples = 100;
    const step = Math.max(1, Math.floor(channelData.length / samples));
    // Stride downsampling for fast processing even on large FLAC/ALAC tracks
    const stride = Math.max(1, Math.floor(step / 40));
    const rawPeaks = [];
    let globalMax = 0;
    
    for (let i = 0; i < samples; i++) {
        let peak = 0;
        const start = i * step;
        const end = Math.min(channelData.length, start + step);
        for (let j = start; j < end; j += stride) {
            const val = Math.abs(channelData[j]);
            if (val > peak) peak = val;
        }
        if (peak > globalMax) globalMax = peak;
        rawPeaks.push(peak);
    }
    
    // Normalize peaks between 0.08 and 1.0 so bars are crisp and clearly visible
    return rawPeaks.map(p => {
        if (globalMax === 0) return 0.15;
        const norm = p / globalMax;
        return parseFloat(Math.max(0.08, norm).toFixed(3));
    });
}

async function generateWaveform(file, path) {
    if (!State.audioContext) {
        State.audioContext = new (window.AudioContext || window.webkitAudioContext)();
    }
    if (State.audioContext.state === 'suspended') {
        try { await State.audioContext.resume(); } catch (e) {}
    }
    
    try {
        const arrayBuffer = await file.arrayBuffer();
        let decodedResult = null;
        
        // 1. Try native Web Audio API decodeAudioData
        try {
            decodedResult = await State.audioContext.decodeAudioData(arrayBuffer.slice(0));
        } catch (eNativeDecode) {
            // 2. Fallback to software decoder for ALAC / lossless M4A
            try {
                const decoded = await decodeAudioFallback(file, path);
                decodedResult = decoded.decodedResult;
            } catch (eDecFallback) {
                console.warn("[BasePlayer] Fallback decoder failed for waveform:", eDecFallback);
            }
        }
        
        if (!decodedResult) return;
        
        const peaks = extractWaveformPeaks(decodedResult);
        if (!peaks || peaks.length === 0) return;
        
        // Only draw to canvas if this track is still the current active track
        if (State.queueIndex !== -1 && State.queue[State.queueIndex] === path) {
            drawWaveform(peaks);
        }
        
        if (State.meta[path]) {
            State.meta[path].waveform = peaks;
            const dur = decodedResult.duration || (decodedResult.length && decodedResult.sampleRate ? decodedResult.length / decodedResult.sampleRate : 0);
            if (dur && (!State.meta[path].duration || isNaN(State.meta[path].duration))) {
                State.meta[path].duration = dur;
                updateTrackDurationInView(path, dur);
            }
            queueMetaSave(path);
        }
    } catch (e) {
        console.warn("Waveform generation skipped for track", e);
    }
}

function drawWaveform(peaks, progressRatio) {
    const canvas = DOM.waveformCanvas;
    if (!canvas || !canvas.parentElement) return;
    const ctx = canvas.getContext('2d');
    
    const parent = canvas.parentElement;
    const width = parent.clientWidth || canvas.clientWidth || (window.innerWidth <= 768 ? window.innerWidth - 30 : 300);
    const height = parent.clientHeight || canvas.clientHeight || (window.innerWidth <= 768 && (!DOM.appContainer || !DOM.appContainer.classList.contains('view-nowplaying')) ? 42 : 48);
    if (width <= 0 || height <= 0) return;
    
    const dpr = window.devicePixelRatio || 1;
    const targetW = Math.floor(width * dpr);
    const targetH = Math.floor(height * dpr);
    if (canvas.width !== targetW || canvas.height !== targetH) {
        canvas.width = targetW;
        canvas.height = targetH;
        canvas.style.width = `${width}px`;
        canvas.style.height = `${height}px`;
    }
    
    ctx.resetTransform();
    ctx.scale(dpr, dpr);
    ctx.clearRect(0, 0, width, height);
    
    if (!peaks || !Array.isArray(peaks) || peaks.length === 0) return;
    
    if (progressRatio === undefined) {
        if (DOM.audio && DOM.audio.duration && !isNaN(DOM.audio.duration) && DOM.audio.duration > 0) {
            progressRatio = DOM.audio.currentTime / DOM.audio.duration;
        } else {
            progressRatio = 0;
        }
    }
    progressRatio = Math.max(0, Math.min(1, progressRatio));
    
    const count = peaks.length;
    const barSpacing = 1;
    const totalSpacing = (count - 1) * barSpacing;
    const barWidth = Math.max(1.5, (width - totalSpacing) / count);
    const step = barWidth + barSpacing;
    
    const maxBarHeight = height - 1;
    const playheadX = progressRatio * width;
    
    // Respect system light / dark mode: reddish accent behind playhead, light grey in front
    const isLight = window.matchMedia && window.matchMedia('(prefers-color-scheme: light)').matches;
    const playedColor = isLight ? '#d32f2f' : '#ff5252';
    const unplayedColor = isLight ? '#cbd5e1' : 'rgba(255, 255, 255, 0.28)';
    
    // Pass 1: Draw all bars in unplayed light grey
    ctx.fillStyle = unplayedColor;
    for (let i = 0; i < count; i++) {
        const peak = peaks[i];
        const h = Math.max(2, Math.min(maxBarHeight, peak * maxBarHeight));
        const x = i * step;
        const y = height - h;
        if (x + barWidth > width + 1) break;
        ctx.fillRect(x, y, barWidth, h);
    }
    
    // Pass 2: Draw bars behind invisible playhead in purple
    if (playheadX > 0) {
        ctx.save();
        ctx.beginPath();
        ctx.rect(0, 0, playheadX, height);
        ctx.clip();
        
        ctx.fillStyle = playedColor;
        for (let i = 0; i < count; i++) {
            const peak = peaks[i];
            const h = Math.max(2, Math.min(maxBarHeight, peak * maxBarHeight));
            const x = i * step;
            const y = height - h;
            if (x > playheadX) break;
            ctx.fillRect(x, y, barWidth, h);
        }
        ctx.restore();
    }
}

function updateTrackDurationInView(path, duration) {
    if (!duration || isNaN(duration)) return;
    const formatted = formatTime(duration);
    
    // Update track table row duration cell if present
    if (State.currentTracks && State.currentTracks.includes(path)) {
        const rowIdx = State.currentTracks.indexOf(path);
        const tr = DOM.tracksTbody.children[rowIdx];
        if (tr && tr.children[4]) {
            tr.children[4].textContent = formatted;
        }
    }
    
    // Update queue item duration if present
    const queueDurEl = DOM.queueList.querySelector(`[data-path="${path}"] .queue-item-duration`);
    if (queueDurEl) {
        queueDurEl.textContent = formatted;
    }
}

// ==========================================
// Active Queue Management & Shuffle
// ==========================================
function toggleQueueDrawer() {
    const isHidden = DOM.queueDrawer.classList.contains('hidden');
    setQueueDrawerOpen(isHidden);
}

function setQueueDrawerOpen(open) {
    if (open) {
        DOM.queueDrawer.classList.remove('hidden');
        DOM.btnQueue.classList.add('active');
        renderQueue();
    } else {
        DOM.queueDrawer.classList.add('hidden');
        DOM.btnQueue.classList.remove('active');
    }
}

function renderQueue() {
    const total = State.queue.length;
    DOM.queueCountBadge.textContent = `${total} track${total === 1 ? '' : 's'}`;
    
    // Now Playing Card
    if (State.queueIndex >= 0 && State.queueIndex < total) {
        const npPath = State.queue[State.queueIndex];
        const npMeta = State.meta[npPath] || { name: npPath.split('/').pop() };
        const artSrc = getArtworkForTrack(npPath);
        
        DOM.queueNowPlaying.innerHTML = `
            <img src="${artSrc || NO_ART_SVG}" alt="">
            <div class="queue-item-info">
                <span class="queue-item-title">${npMeta.title || npMeta.name}</span>
                <span class="queue-item-artist">${npMeta.artist || 'Unknown Artist'}</span>
            </div>
            <span class="badge" style="color: var(--accent);"><i class="fa-solid fa-volume-high"></i> Playing</span>
        `;
    } else {
        DOM.queueNowPlaying.innerHTML = '<div class="queue-empty-text">Nothing currently playing</div>';
    }
    
    // Up Next List
    DOM.queueList.innerHTML = '';
    if (DOM.mobileQueueList) DOM.mobileQueueList.innerHTML = '';
    
    const upcoming = [];
    for (let i = State.queueIndex + 1; i < total; i++) {
        upcoming.push({ path: State.queue[i], originalIndex: i });
    }
    
    if (DOM.mobileQueueBadge) {
        DOM.mobileQueueBadge.textContent = `${upcoming.length} upcoming`;
    }
    
    if (upcoming.length === 0) {
        DOM.queueList.innerHTML = '<div class="queue-empty-text">No upcoming tracks in queue</div>';
        if (DOM.mobileQueueList) {
            DOM.mobileQueueList.innerHTML = '<div class="queue-empty-text">No upcoming tracks in queue</div>';
        }
        return;
    }
    
    upcoming.forEach((item, idx) => {
        const path = item.path;
        const meta = State.meta[path] || { name: path.split('/').pop() };
        const artSrc = getArtworkForTrack(path);
        
        const createItemEl = () => {
            const el = document.createElement('div');
            el.className = 'queue-item';
            el.setAttribute('data-path', path);
            el.innerHTML = `
                <img class="queue-item-thumb" src="${artSrc || NO_ART_SVG}" alt="">
                <div class="queue-item-info">
                    <span class="queue-item-title">${meta.title || meta.name}</span>
                    <span class="queue-item-artist">${meta.artist || 'Unknown Artist'}</span>
                </div>
                <span class="queue-item-duration">${meta.duration ? formatTime(meta.duration) : ''}</span>
                <button class="queue-item-remove btn-icon" title="Remove track from queue"><i class="fa-solid fa-xmark"></i></button>
            `;
            
            el.addEventListener('click', (e) => {
                if (e.target.closest('.queue-item-remove')) return;
                playTrackQueue(State.queue, item.originalIndex);
            });
            
            el.querySelector('.queue-item-remove').addEventListener('click', (e) => {
                e.stopPropagation();
                removeTrackFromQueue(item.originalIndex);
            });
            
            el.addEventListener('contextmenu', (e) => {
                e.preventDefault();
                showContextMenu(e.clientX, e.clientY, { type: 'queue', index: item.originalIndex, path });
            });
            return el;
        };
        
        DOM.queueList.appendChild(createItemEl());
        if (DOM.mobileQueueList) {
            DOM.mobileQueueList.appendChild(createItemEl());
        }
    });
}

function shuffleQueue() {
    if (State.queue.length <= 1) {
        showNotification('Not enough tracks in queue to shuffle.');
        return;
    }
    
    const startIndex = State.queueIndex + 1;
    if (startIndex >= State.queue.length) {
        showNotification('No upcoming tracks to shuffle.');
        return;
    }
    
    const upcoming = State.queue.slice(startIndex);
    for (let i = upcoming.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [upcoming[i], upcoming[j]] = [upcoming[j], upcoming[i]];
    }
    
    State.queue = [...State.queue.slice(0, startIndex), ...upcoming];
    renderQueue();
    showNotification('Upcoming queue shuffled.');
}

function clearQueue() {
    if (State.queue.length === 0) return;
    
    if (State.queueIndex >= 0 && State.queueIndex < State.queue.length) {
        State.queue = [State.queue[State.queueIndex]];
        State.queueIndex = 0;
        showNotification('Cleared upcoming queue.');
    } else {
        State.queue = [];
        State.queueIndex = -1;
        showNotification('Queue cleared.');
    }
    renderQueue();
    renderTracks(State.currentTracks);
}

function removeTrackFromQueue(index) {
    if (index < 0 || index >= State.queue.length) return;
    State.queue.splice(index, 1);
    if (index < State.queueIndex) {
        State.queueIndex--;
    }
    renderQueue();
    renderTracks(State.currentTracks);
    showNotification('Track removed from queue.');
}

function addTrackToQueue(path) {
    State.queue.push(path);
    if (State.queueIndex === -1) {
        playTrackQueue(State.queue, 0);
    } else {
        renderQueue();
        const meta = State.meta[path];
        showNotification(`Added "${(meta && meta.title) || path.split('/').pop()}" to queue.`);
    }
}

function addTracksToQueue(paths, title = '') {
    if (!paths || paths.length === 0) return;
    State.queue.push(...paths);
    if (State.queueIndex === -1) {
        playTrackQueue(State.queue, 0);
    } else {
        renderQueue();
        showNotification(`Added ${paths.length} track${paths.length === 1 ? '' : 's'} ${title ? `(${title}) ` : ''}to queue.`);
    }
}

function playTrackNext(path) {
    if (State.queueIndex === -1 || State.queue.length === 0) {
        playTrackQueue([path], 0);
        return;
    }
    State.queue.splice(State.queueIndex + 1, 0, path);
    renderQueue();
    const meta = State.meta[path];
    showNotification(`Will play "${(meta && meta.title) || path.split('/').pop()}" next.`);
}

function playTracksNext(paths, title = '') {
    if (!paths || paths.length === 0) return;
    if (State.queueIndex === -1 || State.queue.length === 0) {
        playTrackQueue(paths, 0);
        return;
    }
    State.queue.splice(State.queueIndex + 1, 0, ...paths);
    renderQueue();
    showNotification(`Will play ${paths.length} track${paths.length === 1 ? '' : 's'} ${title ? `(${title}) ` : ''}next.`);
}

function shuffleAndPlayTracks(tracks, title = '') {
    if (!tracks || tracks.length === 0) return;
    
    const shuffled = [...tracks];
    for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    
    if (State.queue.length > 0) {
        State.queue = [...shuffled, ...State.queue];
    } else {
        State.queue = [...shuffled];
    }
    
    playTrackQueue(State.queue, 0);
    showNotification(`Shuffled and playing ${shuffled.length} tracks ${title ? `(${title}) ` : ''}at front of queue.`);
}

// ==========================================
// Context Menu Management
// ==========================================
function showContextMenu(x, y, target) {
    State.contextMenuTarget = target;
    
    if (target.type === 'queue') {
        DOM.cmDividerRemove.classList.remove('hidden');
        DOM.cmItemRemove.classList.remove('hidden');
    } else {
        DOM.cmDividerRemove.classList.add('hidden');
        DOM.cmItemRemove.classList.add('hidden');
    }
    
    DOM.contextMenu.classList.remove('hidden');
    
    const menuWidth = 180;
    const menuHeight = target.type === 'queue' ? 180 : 150;
    let posX = x;
    let posY = y;
    
    if (x + menuWidth > window.innerWidth) posX = window.innerWidth - menuWidth - 10;
    if (y + menuHeight > window.innerHeight) posY = window.innerHeight - menuHeight - 10;
    
    DOM.contextMenu.style.left = `${posX}px`;
    DOM.contextMenu.style.top = `${posY}px`;
}

function hideContextMenu() {
    DOM.contextMenu.classList.add('hidden');
    State.contextMenuTarget = null;
}

function handleContextMenuAction(e) {
    const item = e.target.closest('.context-menu-item');
    if (!item) return;
    
    const action = item.getAttribute('data-action');
    const target = State.contextMenuTarget;
    hideContextMenu();
    if (!target) return;
    
    if (action === 'play-now') {
        if (target.type === 'track') {
            const queue = target.allTracks || State.currentTracks;
            const idx = queue.indexOf(target.path);
            playTrackQueue(queue, idx !== -1 ? idx : 0);
        } else if (target.type === 'folder') {
            if (target.tracks && target.tracks.length > 0) {
                playTrackQueue(target.tracks, 0);
            }
        } else if (target.type === 'queue') {
            playTrackQueue(State.queue, target.index);
        }
    } else if (action === 'shuffle-play') {
        if (target.type === 'folder') {
            shuffleAndPlayTracks(target.tracks, target.title);
        } else if (target.type === 'track') {
            const tracks = target.allTracks || State.currentTracks;
            shuffleAndPlayTracks(tracks, '');
        }
    } else if (action === 'play-next') {
        if (target.type === 'track') {
            playTrackNext(target.path);
        } else if (target.type === 'folder') {
            playTracksNext(target.tracks, target.title);
        }
    } else if (action === 'add-queue') {
        if (target.type === 'track') {
            addTrackToQueue(target.path);
        } else if (target.type === 'folder') {
            addTracksToQueue(target.tracks, target.title);
        }
    } else if (action === 'remove-queue') {
        if (target.type === 'queue') {
            removeTrackFromQueue(target.index);
        }
    }
}
