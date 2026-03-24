let db = null;
let SQL = null;

const searchField    = document.getElementById('searchField');
const cardsContainer = document.querySelector('.user_cards1');
const template       = document.querySelector('[data-template]');

// ────────────────────────────────────────────────
// Initialize sql.js engine
// ────────────────────────────────────────────────
async function initSqlJsEngine() {
    try {
        const SQLModule = await initSqlJs({
            locateFile: file => `https://cdnjs.cloudflare.com/ajax/libs/sql.js/1.10.3/${file}`
            // Tip: If you get wasm loading errors later, try:
            // locateFile: file => `https://sql.js.org/dist/${file}`
            // or download latest from https://github.com/sql-js/sql.js/releases and host locally
        });
        return SQLModule;
    } catch (err) {
        console.error("Failed to load sql.js:", err);
        showError("Failed to initialize SQLite engine. Check console.");
        return null;
    }
}

// ────────────────────────────────────────────────
// Load database from static file (./details.db)
// ────────────────────────────────────────────────
async function loadStaticDatabase() {
    try {
        const url = './details.db';  // must be in same folder as HTML

        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`Failed to fetch database: ${response.status} ${response.statusText}`);
        }

        const arrayBuffer = await response.arrayBuffer();
        const uInt8Array = new Uint8Array(arrayBuffer);

        db = new SQL.Database(uInt8Array);

        // Quick validation: does the 'careers' table exist?
        const tables = db.exec("SELECT name FROM sqlite_master WHERE type='table' AND name='careers'");
        if (!tables.length || !tables[0].values.length) {
            throw new Error("Table 'careers' not found in details.db");
        }

        showMessage("Database loaded successfully.");
        performSearch(); // show all records initially

    } catch (err) {
        console.error("Database load failed:", err);
        showError("Could not load details.db<br>" + err.message + "<br>Make sure:<br>1. You're using a local server (not file://)<br>2. details.db is in the same folder as this HTML");
    }
}

function showMessage(msg) {
    cardsContainer.innerHTML = `<p style="padding:1.5rem; color:#2e7d32; text-align:center; font-weight:500;">${msg}</p>`;
}

function showError(msg) {
    cardsContainer.innerHTML = `<p style="padding:1.5rem; color:#c62828; text-align:center;">${msg}</p>`;
}

// ────────────────────────────────────────────────
// Render function
// ────────────────────────────────────────────────
function renderCareers(rows) {
    cardsContainer.innerHTML = '';

    if (!rows || rows.length === 0) {
        cardsContainer.innerHTML = '<p style="padding:2rem; color:#666; text-align:center;">No careers found.</p>';
        return;
    }

    const fragment = document.createDocumentFragment();

    rows.forEach(row => {
        const clone = template.content.cloneNode(true);   // note: template.content
        const card = clone.querySelector('.card1');

        if (!card) {
            console.warn("No .card1 found in cloned template");
            return;
        }

        const header = card.querySelector('.card_header1');
        const body   = card.querySelector('.card_body1');

        if (header) {
            // Updated display – use subjectName
            header.textContent = 
                `Subject: ${row.subjectName || 'Unknown subject'}, Career Name: ${row.careersName || 'Unknown subject'}`;
        }

        if (body) {
            body.innerHTML = 
                `<div style="white-space: pre-wrap; line-height:1.55;">${escapeHtml(row.careersText || '(no text)')}</div>`;
        }

        fragment.appendChild(clone);
    });

    cardsContainer.appendChild(fragment);
}

function escapeHtml(unsafe) {
    return (unsafe || '').replace(/[&<>"']/g, m => ({
        '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;'
    }[m]));
}

// ────────────────────────────────────────────────
// Search function – uses real SQL
// ────────────────────────────────────────────────

function performSearch() {
    if (!db) {
        showError("Database not loaded yet.");
        return;
    }

    const query = (searchField?.value || '').trim();
    let stmt = null;
    const rows = [];

    try {
        let sql;
        let params = [];

        if (!query) {
            sql = `
                SELECT 
                    c.careersID,
                    c.subjectFID,
                    s.subject AS subjectName,
                    c.careersText,
                    c.careersName
                FROM careers c
                LEFT JOIN subjectList s ON c.subjectFID = s.subjectID
                ORDER BY c.careersID DESC
            `;
        } else {
            const term = `%${query}%`;
            sql = `
                SELECT 
                    c.careersID,
                    c.subjectFID,
                    s.subject AS subjectName,
                    c.careersText,
                    c.careersName
                FROM careers c
                LEFT JOIN subjectList s ON c.subjectFID = s.subjectID
                WHERE c.careersName LIKE ? 
                   OR c.careersText LIKE ?
                ORDER BY 
                    CASE 
                        WHEN c.careersName LIKE ? THEN 1 
                        WHEN c.careersText LIKE ? THEN 2 
                        ELSE 3 
                    END,
                    c.careersID DESC
            `;
            params = [term, term, term, term];
        }

        stmt = db.prepare(sql);
        if (params.length > 0) {
            stmt.bind(params);
        }

        // Optional debug: count total rows (still on careers table)
        const countStmt = db.prepare("SELECT COUNT(*) AS cnt FROM careers");
        countStmt.step();
        const totalRows = countStmt.getAsObject().cnt;
        console.log(`Total rows in 'careers' table: ${totalRows}`);
        countStmt.free();

        let stepCount = 0;
        while (stmt.step()) {
            stepCount++;
            const rowObj = stmt.getAsObject();
            console.log(`Row ${stepCount}:`, rowObj);
            rows.push(rowObj);
        }
        console.log(`Total rows fetched: ${rows.length}`);

        if (rows.length === 0) {
            showError(`No matching careers found.<br>Total in DB: ${totalRows}`);
        } else {
            renderCareers(rows);
        }

    } catch (err) {
        console.error("Search/prepare error:", err);
        showError("Query failed: " + err.message);
    } finally {
        if (stmt) stmt.free();
    }
}

// ────────────────────────────────────────────────
// Start everything when DOM is ready
// ────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', async () => {
    // Safe access (in case elements missing)
    if (!searchField || !cardsContainer || !template) {
        console.error("Critical DOM elements missing");
        if (cardsContainer) {
            cardsContainer.innerHTML = '<p style="color:red; padding:2rem;">Page structure error – check HTML</p>';
        }
        return;
    }

    SQL = await initSqlJsEngine();
    if (SQL) {
        await loadStaticDatabase();
    }

    // Live search (debounced)
    let debounceTimer;
    searchField.addEventListener('input', () => {
        clearTimeout(debounceTimer);
        debounceTimer = setTimeout(performSearch, 400);
    });

    // Enter key / submit
    document.querySelector('.search_form')?.addEventListener('submit', e => {
        e.preventDefault();
        performSearch();
    });
});